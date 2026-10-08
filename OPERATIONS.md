# Supreme Cutx operations checklist

## Before the first real day

- Set a long, unique `JWT_SECRET` in the backend environment.
- Use a production MongoDB database with authentication and restricted network access.
- Create the first cashier account and at least one staff account.
- Confirm that staff can record a job, the cashier can approve or void it, and the daily total updates.
- Confirm that logout works on the shared shop device.

## Backups

Back up the MongoDB database at least daily and keep several days of backups. Run a restore test before relying on the system for business records.

For a local MongoDB database, a backup can be created with:

```powershell
mongodump --uri="$env:MONGO_URI" --out=".\backups\$(Get-Date -Format yyyy-MM-dd)"
```

Restore only into a separate test database first:

```powershell
mongorestore --uri="$env:RESTORE_MONGO_URI" ".\backups\YYYY-MM-DD"
```

For MongoDB Atlas or another hosted provider, use its scheduled backup feature and verify that a restore is available.

## Daily check

- Review pending jobs before closing.
- Export the job records CSV when the day is complete.
- Check that the collected total agrees with the cash/card/mobile payment records.
- Keep the exported CSV and database backup according to the business retention policy.

## If something goes wrong

- Do not delete or recreate the database as a first response.
- Export the current job records if the dashboard is available.
- Check the backend `/health` endpoint and backend logs.
- Preserve the latest database backup and contact the person responsible for the deployment before restoring data.
