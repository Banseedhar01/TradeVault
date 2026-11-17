# Backend integration tests

Tests create and remove only temporary `tradevault_test_*` databases on localhost.
They refuse remote hosts and never use `MONGODB_URI` or the application's databases.

Start a separate MongoDB replica set, for example:

```sh
docker run --detach --name tradevault-tests --publish 27018:27018 \
  mongo:7 --port 27018 --replSet tradevault-tests --bind_ip_all
docker exec tradevault-tests mongosh --port 27018 --quiet --eval \
  'rs.initiate({_id:"tradevault-tests",members:[{_id:0,host:"localhost:27018"}]})'
```

From `backend`, run:

```sh
.venv-vercel/bin/python -m unittest discover -s tests -v
```

Use `TEST_MONGODB_URI` to change the local test port/replica set. CI starts its
own MongoDB container on port 27017 and supplies that variable automatically.

The tests cover closed P&L edits, moves across dates/stages/accounts, status
changes, empty trading-day removal, concurrent writes, and transaction rollback
when create/update/delete statistics recalculation fails.
