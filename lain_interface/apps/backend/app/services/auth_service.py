"""
Auth service — login, token refresh, logout.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.user_repo = UserRepository(db)

    async def login(self, identifier: str, password: str) -> Optional[TokenResponse]:
        """Authenticate user and return token pair."""
        user = await self.user_repo.get_by_username_or_email(identifier)
        if not user or not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        # Persist hashed refresh token for revocation support
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        rt = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(rt)
        await self.db.flush()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh(self, refresh_token_str: str) -> Optional[TokenResponse]:
        """Issue new access + refresh token pair from a valid refresh token."""
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            return None

        token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
        from sqlalchemy import select
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,  # noqa: E712
            )
        )
        stored_rt = result.scalar_one_or_none()
        if not stored_rt:
            return None

        # Rotate — revoke old, issue new
        stored_rt.is_revoked = True
        user = await self.user_repo.get_by_id(stored_rt.user_id)
        if not user or not user.is_active:
            return None

        access_token = create_access_token({"sub": str(user.id)})
        new_refresh = create_refresh_token({"sub": str(user.id)})
        new_token_hash = hashlib.sha256(new_refresh.encode()).hexdigest()
        rt = RefreshToken(
            user_id=user.id,
            token_hash=new_token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(rt)
        await self.db.flush()

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, refresh_token_str: str) -> bool:
        """Revoke a refresh token."""
        token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
        from sqlalchemy import select
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored_rt = result.scalar_one_or_none()
        if stored_rt:
            stored_rt.is_revoked = True
            await self.db.flush()
        return True
