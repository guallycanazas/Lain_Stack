"""
User management endpoints (admin only for most operations).
"""
from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AdminOnly, AdminOrOperator, CurrentUser, DBSession
from app.core.security import hash_password
from app.models.audit_log import AuditAction
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.user import PasswordChange, UserCreate, UserRead, UserUpdate, UserUpdateRole
from app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserRead], dependencies=[AdminOnly])
async def list_users(
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    repo = UserRepository(db)
    skip = (page - 1) * page_size
    items = await repo.list_all(skip=skip, limit=page_size)
    total = await repo.count_all()
    return PaginatedResponse.create(
        items=[UserRead.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED, dependencies=[AdminOnly])
async def create_user(body: UserCreate, current_user: CurrentUser, db: DBSession):
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
        role=body.role,
        bio=body.bio,
    )
    user = await repo.create(user)
    await audit.log(AuditAction.CREATE, user=current_user, resource_type="user", resource_id=user.id)
    return user


@router.get("/{user_id}", response_model=UserRead, dependencies=[AdminOrOperator])
async def get_user(user_id: int, db: DBSession):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserRead, dependencies=[AdminOnly])
async def update_user(user_id: int, body: UserUpdate, current_user: CurrentUser, db: DBSession):
    repo = UserRepository(db)
    audit = AuditService(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.bio is not None:
        user.bio = body.bio
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    user = await repo.update(user)
    await audit.log(AuditAction.UPDATE, user=current_user, resource_type="user", resource_id=user_id)
    return user


@router.patch("/{user_id}/role", response_model=UserRead, dependencies=[AdminOnly])
async def update_user_role(user_id: int, body: UserUpdateRole, current_user: CurrentUser, db: DBSession):
    repo = UserRepository(db)
    audit = AuditService(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    user = await repo.update(user)
    await audit.log(AuditAction.UPDATE, user=current_user, resource_type="user", resource_id=user_id, description=f"Role changed to {body.role}")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[AdminOnly])
async def delete_user(user_id: int, current_user: CurrentUser, db: DBSession):
    repo = UserRepository(db)
    audit = AuditService(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    await repo.soft_delete(user)
    await audit.log(AuditAction.DELETE, user=current_user, resource_type="user", resource_id=user_id)


@router.post("/me/change-password", response_model=SuccessResponse)
async def change_password(body: PasswordChange, current_user: CurrentUser, db: DBSession):
    from app.core.security import verify_password
    audit = AuditService(db)
    repo = UserRepository(db)
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(body.new_password)
    await repo.update(current_user)
    await audit.log(AuditAction.PASSWORD_CHANGE, user=current_user)
    return SuccessResponse(message="Password changed successfully")
