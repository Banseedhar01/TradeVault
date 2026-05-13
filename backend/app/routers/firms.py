from fastapi import APIRouter, HTTPException
from beanie import PydanticObjectId

from app.models.prop_firm import PropFirm
from app.utils import serialize_doc, serialize_docs

router = APIRouter()

@router.get("/firms", response_model=dict)
async def get_firms():
    try:
        firms = await PropFirm.find_all().to_list()
        return {"success": True, "data": serialize_docs(firms)}
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ERROR", "message": str(e)}}

@router.post("/firms", response_model=dict)
async def create_firm(firm: PropFirm):
    try:
        new_firm = await firm.create()
        return {"success": True, "data": serialize_doc(new_firm)}
    except Exception as e:
        return {"success": False, "error": {"code": "CREATE_ERROR", "message": str(e)}}

@router.get("/firms/{firm_id}", response_model=dict)
async def get_firm(firm_id: PydanticObjectId):
    try:
        firm = await PropFirm.get(firm_id)
        if not firm:
            raise HTTPException(status_code=404, detail="Firm not found")
        return {"success": True, "data": serialize_doc(firm)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ERROR", "message": str(e)}}

@router.put("/firms/{firm_id}", response_model=dict)
async def update_firm(firm_id: PydanticObjectId, firm_data: dict):
    try:
        firm = await PropFirm.get(firm_id)
        if not firm:
            raise HTTPException(status_code=404, detail="Firm not found")
        await firm.update({"$set": firm_data})
        updated_firm = await PropFirm.get(firm_id)
        return {"success": True, "data": serialize_doc(updated_firm)}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "UPDATE_ERROR", "message": str(e)}}

@router.delete("/firms/{firm_id}", response_model=dict)
async def delete_firm(firm_id: PydanticObjectId):
    try:
        firm = await PropFirm.get(firm_id)
        if not firm:
            raise HTTPException(status_code=404, detail="Firm not found")
        await firm.delete()
        return {"success": True, "data": {"id": str(firm_id)}}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": {"code": "DELETE_ERROR", "message": str(e)}}
