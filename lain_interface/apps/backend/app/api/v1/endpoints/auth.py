"""
Auth endpoints: login, refresh, logout, me.
"""
from fastapi import APIRouter, HTTPException, Request, status

from app.core.dependencies import CurrentUser, DBSession
from app.core.security import hash_password
from app.models.audit_log import AuditAction
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new viewer account",
)
async def register(body: RegisterRequest, request: Request, db: DBSession):
    repo = UserRepository(db)
    audit = AuditService(db)

    if await repo.get_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if await repo.get_by_username(body.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=UserRole.VIEWER,
        is_active=True,
    )
    user = await repo.create(user)
    await audit.log(
        AuditAction.CREATE,
        user=user,
        resource_type="user",
        resource_id=user.id,
        description="Self registration",
        request=request,
    )
    return user


@router.post("/login", response_model=TokenResponse, summary="Authenticate and get token pair")
async def login(body: LoginRequest, request: Request, db: DBSession):
    svc = AuthService(db)
    audit = AuditService(db)
    tokens = await svc.login(body.username, body.password)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    # Log successful login (user retrieved inside service, re-fetch for audit)
    from app.repositories.user_repository import UserRepository
    user = await UserRepository(db).get_by_username_or_email(body.username)
    await audit.log(
        AuditAction.LOGIN,
        user=user,
        description="User logged in",
        request=request,
    )
    return tokens


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(body: RefreshRequest, db: DBSession):
    svc = AuthService(db)
    tokens = await svc.refresh(body.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return tokens


@router.post("/logout", summary="Logout and revoke refresh token")
async def logout(body: RefreshRequest, current_user: CurrentUser, db: DBSession):
    svc = AuthService(db)
    audit = AuditService(db)
    await svc.logout(body.refresh_token)
    await audit.log(AuditAction.LOGOUT, user=current_user, description="User logged out")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserRead, summary="Get current authenticated user")
async def get_me(current_user: CurrentUser):
    return current_user
