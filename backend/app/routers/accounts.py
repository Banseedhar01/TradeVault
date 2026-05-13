from fastapi import APIRouter, HTTPException
from beanie import PydanticObjectId

from app.models.account import Account, Stage
from app.utils import serialize_doc, serialize_docs

router = APIRouter()

@router.get("/accounts", response_model=dict)
async def get_accounts():
    try:
        accounts = await Account.find_all().to_list()
        return {"success": True, "data": serialize_docs(accounts)}
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ERROR", "message": str(e)}}

@router.post("/accounts", response_model=dict)
async def create_account(account: Account):
    try:
        new_account = await account.create()
        return {"success": True, "data": serialize_doc(new_account)}
    except Exception as e:
        return {"success": False, "error": {"code": "CREATE_ERROR", "message": str(e)}}

@router.get("/accounts/{account_id}", response_model=dict)
async def get_account(account_id: PydanticObjectId):
    try:
        account = await Account.get(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"success": True, "data": serialize_doc(account)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ERROR", "message": str(e)}}

@router.put("/accounts/{account_id}", response_model=dict)
async def update_account(account_id: PydanticObjectId, account_data: dict):
    try:
        account = await Account.get(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        await account.update({"$set": account_data})
        updated_account = await Account.get(account_id)
        return {"success": True, "data": serialize_doc(updated_account)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "UPDATE_ERROR", "message": str(e)}}

@router.post("/accounts/{account_id}/stages", response_model=dict)
async def add_stage(account_id: PydanticObjectId, stage: Stage):
    try:
        account = await Account.get(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        account.stages.append(stage)
        await account.save()
        return {"success": True, "data": serialize_doc(account)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "ADD_STAGE_ERROR", "message": str(e)}}

@router.put("/accounts/{account_id}/stages/{stage_id}", response_model=dict)
async def update_stage(account_id: PydanticObjectId, stage_id: int, stage_data: dict):
    try:
        account = await Account.get(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        if stage_id >= len(account.stages):
            raise HTTPException(status_code=404, detail="Stage not found")
        for key, value in stage_data.items():
            if hasattr(account.stages[stage_id], key):
                setattr(account.stages[stage_id], key, value)
        await account.save()
        return {"success": True, "data": serialize_doc(account)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "UPDATE_STAGE_ERROR", "message": str(e)}}

@router.delete("/accounts/{account_id}", response_model=dict)
async def delete_account(account_id: PydanticObjectId):
    try:
        account = await Account.get(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        await account.delete()
        return {"success": True, "data": {"id": str(account_id)}}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "DELETE_ERROR", "message": str(e)}}
