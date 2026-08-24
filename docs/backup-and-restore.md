# Backup and Restore

Create a source backup before a broad refactor, dependency upgrade, or release:

```bash
./scripts/backup-project.sh
```

Pass another directory when the archive should live outside the project:

```bash
./scripts/backup-project.sh /path/to/backups
```

Generated archives exclude Git history, dependencies, build output, browser reports, and prior local backups. Each archive has a matching SHA-256 checksum file.

## Restore Drill

1. Verify the archive:

   ```bash
   sha256sum -c rc-world-YYYYMMDDTHHMMSSZ.tar.gz.sha256
   ```

2. Extract it into an empty temporary directory:

   ```bash
   mkdir rc-world-restore
   tar --no-same-owner -xzf rc-world-YYYYMMDDTHHMMSSZ.tar.gz -C rc-world-restore
   ```

3. Confirm `package.json`, `src/main.js`, `tests/browser-smoke.spec.js`, and the screenshot set exist.

4. Reinstall and validate from the restored directory:

   ```bash
   npm ci
   npm test
   npm run build
   npm run test:browser
   ```

5. Record the archive path, checksum result, validation result, and drill date in the active release record.

## Rollback

- For unreleased local work, restore the latest verified archive into a clean directory.
- For a published Git change, revert the release commit and let the Pages workflow redeploy `main`.
- Do not overwrite the only working copy; validate the restored copy before replacing any project files.
