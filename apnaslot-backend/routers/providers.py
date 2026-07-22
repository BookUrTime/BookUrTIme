from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models import Provider, ProviderTypeEnum
from schemas import ProviderResponse

router = APIRouter(prefix="/providers", tags=["Providers"])

@router.get("", response_model=List[ProviderResponse])
async def get_providers(
    type: Optional[ProviderTypeEnum] = Query(None),
    city: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Provider)
    if type:
        query = query.where(Provider.type == type)
    if city:
        query = query.where(Provider.city.ilike(f"%{city}%"))
    
    result = await db.execute(query)
    providers = result.scalars().all()
    return providers
