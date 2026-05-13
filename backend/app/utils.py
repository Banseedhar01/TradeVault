from fastapi.encoders import jsonable_encoder


def serialize_doc(doc) -> dict:
    d = jsonable_encoder(doc)
    if '_id' in d:
        d['id'] = d.pop('_id')
    return d


def serialize_docs(docs: list) -> list:
    return [serialize_doc(d) for d in docs]
