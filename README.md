# CCTS Ledger

[Open CCTS Ledger](https://coolcode.ca/ccts-ledger/)

<!-- coolcode:guide -->
Compare Rogers in 2023–24 with the Rogers/Shaw entry in 2024–25, where the published accepted count was 6,485. Open a complaint issues workbook to filter by provider, province and service and count distinct complaints separately from issue rows.
<!-- /coolcode:guide -->

The comparison uses the first ten provider entries in each CCTS annual report’s leading-provider HTML table for 2022–23, 2023–24 and 2024–25. It presents the numeric observations with original report links. Select a provider, then switch between accepted count, concluded count, share, escalation rate and resolution rate. The history follows the exact published brand and shows missing entries explicitly. Rogers and Shaw were separate earlier. A parent-company merger does not justify silently summing brands or transferring their histories.

Resolution rate uses concluded complaints as its denominator. A complaint may be accepted in one year and concluded in the following year. The published share of complaints uses all accepted complaints. A subscriber-normalized rate would require provider-level customer counts for matching brands, services and time periods. The annual comparison does not calculate that rate.

Use the two official .xlsx download links to get the selected year’s workbooks directly from CCTS. Choose one file locally. Workbook parsing runs in a worker on your device. Issue files count issue rows and distinct complaint IDs for your choice of provider, province and service. Operational files aggregate their recorded statuses, including rows accepted before the report period. IDs in different workbooks cannot be joined. Each new upload replaces the previous workbook. A reset clears local rows. The repository carries no CCTS workbook or complaint-level records. CCTS provides the workbook terms on its Licence and Notes sheet.

[Annual and mid-year report directory](https://www.ccts-cprst.ca/codes-stats-and-reports/ccts-reports/annual-and-mid-year-reports/). The monthly import checks for new completed annual editions, validates the report layout and stores factual comparisons. Install lxml and run `python scripts/refresh.py` to refresh the public table.

## Development

Run `node --test tests/*.test.mjs`, `python -m unittest discover -s tests` and `python scripts/build.py`. Submit reviewed data and code together. Every Pages deployment runs its desktop and mobile browser checks first.
