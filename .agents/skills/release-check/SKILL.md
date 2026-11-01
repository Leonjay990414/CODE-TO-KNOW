---
name: release-check
description: "Use this skill to assess release readiness, verify quality and security, and prepare deployment and rollback."
---
# Release Check Skill



\## 1. Purpose



This skill defines the standard workflow for checking whether a CODE TO KNOW version is ready for release.



The goal is to ensure that every release is tested, secure, documented, and recoverable.



Never assume a release is ready merely because the application starts successfully.



\## 2. Core Principles



\- Verify before releasing.

\- Never claim a test passed unless it was actually executed.

\- Never expose passwords, API keys, tokens, or private user data.

\- Never use production data for testing.

\- Never deploy without understanding the deployment target and its configuration.

\- Preserve the ability to recover from a failed release.

\- Report incomplete checks honestly.



\## 3. Release Scope



Before checking a release, identify:



\- Version number or release identifier.

\- Main features and changes.

\- Bug fixes included.

\- Known limitations.

\- Database changes.

\- Required environment variables.

\- External services or APIs affected.

\- Deployment target.



If the scope is unclear, ask for clarification before proceeding.



\## 4. Source Code and Git Checks



Verify:



\- The correct branch is selected.

\- The intended changes are committed.

\- The working tree is clean, or remaining changes are explicitly understood.

\- No unrelated files are included.

\- No `.env` files, credentials, private keys, or local databases are committed.

\- Commit history is understandable.

\- The release is based on the intended commit.



Do not rewrite shared Git history without explicit authorization.



\## 5. Dependency and Build Checks



Inspect:



\- Dependency installation status.

\- Package configuration.

\- Dependency version consistency.

\- Build scripts.

\- Missing or incompatible packages.

\- Deprecated or known vulnerable dependencies, where suitable tools are available.



Run the project's actual build command.



Do not invent commands or assume a framework is installed. Inspect `package.json` and project documentation first.



Record the command and its actual result.



\## 6. Testing Checks



Review applicable test categories:



\### Functional tests

\- Registration and login.

\- User profile and account functions.

\- Learning and course functions.

\- Question banks and practice.

\- Mock exams and assessment results.

\- AI learning assistance.

\- Teacher and administrator functions.



Only test features that have actually been implemented.



\### Integration tests

\- Frontend and backend communication.

\- API request and response handling.

\- Database operations.

\- Authentication and authorization.

\- External service connections.



\### UI and responsive tests

\- Desktop layout.

\- Tablet layout.

\- Mobile layout.

\- Navigation and interactive controls.

\- Loading, empty, and error states.



\### Regression tests

\- Confirm that existing features still work after changes.

\- Recheck areas affected by the latest modifications.



Do not mark unexecuted tests as passed.



\## 7. Security Checks



Review:



\- Authentication and session handling.

\- Role and permission enforcement.

\- Server-side input validation.

\- API access controls.

\- Sensitive data exposure.

\- Password handling.

\- Rate limiting where appropriate.

\- Cross-site scripting and injection risks.

\- Dependency vulnerabilities.

\- HTTPS and secure cookie configuration in production.



Check that student, teacher, and administrator permissions are separated correctly.



Never put secrets directly into frontend source code or public repositories.



\## 8. Database Checks



If the release changes database structure or data:



\- Review migration scripts.

\- Verify migration order.

\- Check relationships and constraints.

\- Confirm data compatibility.

\- Prepare a backup before production migration.

\- Define a recovery procedure.

\- Verify the application can read and write the expected data.



Never run destructive production database operations without explicit authorization and a verified recovery plan.



\## 9. Environment Configuration



Confirm that the target environment has the required configuration.



Check:



\- Environment variables.

\- API endpoints.

\- Database connection settings.

\- Authentication settings.

\- Email service settings, if implemented.

\- AI service settings, if implemented.

\- CORS and cookie configuration.

\- Logging and monitoring settings.



Use placeholders in documentation. Never include actual secret values in Git commits or release notes.



Development, testing, and production environments must remain separate.



\## 10. Deployment Readiness



Before deployment, verify:



\- The deployment platform is identified.

\- The correct build output is available.

\- Environment variables are configured.

\- Database migrations are reviewed.

\- HTTPS is configured where required.

\- Domain and routing settings are correct.

\- Backup and recovery procedures are available.

\- Deployment permissions are appropriate.



Do not claim deployment is complete unless the deployment operation has actually succeeded.



\## 11. Post-Deployment Smoke Tests



After deployment, check the actual deployed application:



\- The website can be opened.

\- Main pages load correctly.

\- Login and logout work.

\- Important API endpoints respond correctly.

\- Database access works.

\- Core learning functions work.

\- Error logs do not show critical failures.

\- Mobile and desktop layouts remain usable.



If a critical issue appears, stop further rollout and follow the recovery procedure.



\## 12. Rollback and Recovery



Prepare a rollback plan before production release.



Document:



\- The previous stable version.

\- The commit or release identifier to restore.

\- Database backup location and recovery procedure.

\- Configuration changes that need reversing.

\- Services that may need restarting.

\- Verification steps after rollback.



Do not perform a rollback that could cause data loss without explicit authorization.



\## 13. Release Notes



Every release should include:



\- Version number.

\- Release date.

\- Main changes.

\- New features.

\- Bug fixes.

\- Known issues.

\- Database or configuration changes.

\- Upgrade instructions, if needed.



Use clear language so that developers and project members can understand what changed.



\## 14. Release Decision



Classify the result:



\### Ready

All required checks have passed, and no unresolved critical issue remains.



\### Ready with limitations

The release can proceed only with clearly documented limitations and accepted risks.



\### Not ready

A critical check failed, required verification is incomplete, or a serious security or data risk remains.



Never change a failed or incomplete check into a passing result merely to approve a release.



\## 15. Final Report Format



Provide a release report containing:



1\. Release identifier.

2\. Git branch and commit.

3\. Build result.

4\. Test results.

5\. Security review result.

6\. Database review result.

7\. Environment review result.

8\. Deployment result.

9\. Known issues.

10\. Rollback readiness.

11\. Final release decision.



Clearly distinguish passed, failed, skipped, and not-yet-verified items.



\## 16. Completion Criteria



A release check is complete only when:



\- The release scope is documented.

\- Git state is reviewed.

\- Build results are recorded.

\- Required tests are executed and recorded.

\- Security and database risks are reviewed.

\- Environment configuration is checked.

\- Deployment and rollback plans are reviewed.

\- The final release decision is documented.



The skill must report actual evidence and must never fabricate successful checks or deployment results.

