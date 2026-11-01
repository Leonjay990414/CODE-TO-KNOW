\---

name: bug-fixing

description: Systematically diagnose, reproduce, fix, and verify bugs in the CODE TO KNOW platform without introducing unrelated changes or regressions.

\---



\# Bug Fixing Skill

\# 碼上學｜CODE TO KNOW

\# 錯誤分析與修復技能



\## 1. Skill Purpose



This skill defines the standard workflow for identifying, diagnosing, fixing, and verifying software defects in CODE TO KNOW.



AI agents must use this skill when encountering:



\- Application errors.

\- Frontend rendering problems.

\- Backend failures.

\- API errors.

\- Database errors.

\- Authentication and authorization issues.

\- AI service failures.

\- Responsive layout problems.

\- Performance problems.

\- Unexpected user interactions.

\- Test failures.



The objective is to fix the actual cause of a problem while preserving existing functionality.



\## 2. Core Principles



1\. Understand the problem before changing code.

2\. Reproduce the issue whenever possible.

3\. Identify the root cause instead of hiding symptoms.

4\. Inspect existing architecture before making changes.

5\. Make the smallest appropriate modification.

6\. Protect existing user data.

7\. Avoid unrelated refactoring.

8\. Test the correction.

9\. Check for regressions.

10\. Report actual results honestly.



Never claim an issue is fixed without sufficient verification.



\## 3. Read Project Rules First



Before troubleshooting, inspect:



\- `AGENTS.md`

\- `PROJECT\_RULES.md`

\- `.agents/rules/02-frontend-development.md`

\- `.agents/rules/03-backend-and-api.md`

\- `.agents/rules/04-database-and-security.md`

\- `.agents/rules/05-ai-features.md`

\- `.agents/rules/06-testing-and-quality.md`

\- `.agents/rules/07-git-and-collaboration.md`



Read only the rules relevant to the problem, but always follow applicable project-wide requirements.



\## 4. Understand the Error



Collect the available information:



\- Error message.

\- Error code.

\- Browser console output.

\- Server logs.

\- API response.

\- Network request details.

\- Relevant source files.

\- Recent code changes.

\- Steps that trigger the issue.

\- Expected behavior.

\- Actual behavior.



Do not invent missing logs, error messages, or system behavior.



If the problem description is incomplete, ask for the information necessary to continue.



\## 5. Reproduce the Problem



Attempt to reproduce the issue using the supplied steps.



Record:



1\. Initial conditions.

2\. User role.

3\. Relevant input data.

4\. Operation performed.

5\. Expected result.

6\. Actual result.



If the problem cannot be reproduced, investigate possible differences in:



\- Environment variables.

\- Browser.

\- Device.

\- User permissions.

\- Database records.

\- API availability.

\- Network conditions.

\- Application version.



Clearly distinguish confirmed issues from possible causes.



\## 6. Root Cause Analysis



Inspect the relevant implementation before modifying it.



Investigate possible causes such as:



\### Frontend

\- Incorrect component state.

\- Invalid properties.

\- Incorrect event handling.

\- Missing data.

\- Rendering errors.

\- Incorrect route configuration.

\- Form validation problems.

\- Responsive CSS conflicts.



\### Backend

\- Incorrect business logic.

\- Invalid request handling.

\- Missing validation.

\- Authentication failures.

\- Authorization failures.

\- Unhandled exceptions.

\- Incorrect API response formats.



\### Database

\- Incorrect queries.

\- Missing records.

\- Invalid relationships.

\- Constraint violations.

\- Transaction failures.

\- Data migration problems.



\### AI Services

\- Invalid API requests.

\- Missing API configuration.

\- Usage limits.

\- Timeout errors.

\- Invalid response formats.

\- Inadequate error handling.



\### Environment

\- Missing dependencies.

\- Incorrect environment variables.

\- Port conflicts.

\- Build configuration errors.

\- Version incompatibilities.



Do not select a cause solely because it seems likely. Verify it using available evidence.



\## 7. Plan the Fix



Before changing code, determine:



1\. Root cause.

2\. Files affected.

3\. Required changes.

4\. Possible side effects.

5\. Data impact.

6\. Security implications.

7\. Tests required.



Prefer the smallest change that correctly resolves the problem.



For major architectural changes, explain the impact and obtain user approval before proceeding.



\## 8. Implement the Fix



During implementation:



\- Preserve existing functionality.

\- Follow current coding conventions.

\- Reuse existing utilities and components.

\- Validate all relevant inputs.

\- Handle expected errors.

\- Avoid hardcoded secrets.

\- Avoid unnecessary dependencies.

\- Avoid unrelated file modifications.



If the fix requires a database migration, preserve existing records and provide a safe migration approach.



Never delete production data to make a test pass.



\## 9. Verify the Fix



After making changes, execute appropriate verification.



Possible checks:



\- Build.

\- Type checking.

\- Linting.

\- Unit tests.

\- Integration tests.

\- API tests.

\- Database tests.

\- Browser testing.

\- Responsive layout testing.



Verification must include the original steps that triggered the issue whenever possible.



Report:

\- Tests actually executed.

\- Results.

\- Tests not executed.

\- Remaining uncertainties.



Do not mark unexecuted tests as passed.



\## 10. Regression Testing



Check whether the fix affects related functionality.



Examples:



\### Login Problems

Recheck:

\- Login.

\- Logout.

\- Session handling.

\- Role permissions.

\- Protected pages.



\### Question Bank Problems

Recheck:

\- Question loading.

\- Question display.

\- Answer submission.

\- Score calculation.

\- Result storage.



\### AI Problems

Recheck:

\- AI request.

\- Loading state.

\- Response display.

\- Error handling.

\- Usage limits.



\### Responsive Layout Problems

Recheck:

\- Desktop.

\- Tablet.

\- Mobile.

\- Navigation.

\- Interactive components.



Test scope should match the impact of the change.



\## 11. Security and Data Protection



During debugging:



\- Do not expose passwords.

\- Do not print API keys.

\- Do not share authentication tokens.

\- Do not expose private user records.

\- Do not bypass permission checks.

\- Do not disable security controls as a permanent workaround.

\- Do not use real user data unnecessarily.



If sensitive information appears in logs, avoid reproducing it in reports.



\## 12. Git Safety



Follow:



`.agents/rules/07-git-and-collaboration.md`



Before modifying files:



\- Check the current branch.

\- Check `git status`.

\- Inspect existing uncommitted changes.

\- Avoid overwriting user work.



After fixing:



\- Review the diff.

\- Run relevant tests.

\- Commit only the intended changes.

\- Use a meaningful Commit message.



Suggested Commit format:



`fix: describe the problem and correction`



Examples:



\- `fix: correct student login validation`

\- `fix: handle missing question data`

\- `fix: resolve mobile navigation overflow`



Never use destructive Git commands without explicit authorization.



\## 13. Completion Report



After troubleshooting, provide:



\### Problem

Describe the original issue.



\### Root Cause

Explain the confirmed cause, or identify what remains uncertain.



\### Solution

Describe the correction.



\### Modified Files

List the files changed.



\### Verification

List tests actually executed and their results.



\### Remaining Issues

Identify unresolved problems or limitations.



\### Git Status

Report whether changes were committed and pushed, only when those operations were actually performed.



\## 14. Important Restrictions



AI agents must not:



\- Guess the root cause and present it as confirmed.

\- Modify unrelated functionality.

\- Delete files without authorization.

\- Remove tests simply to make them pass.

\- Disable security controls to hide errors.

\- Replace entire modules unnecessarily.

\- Change database records without permission.

\- Introduce new dependencies without justification.

\- Claim success without verification.

\- Push changes without following the Git workflow.



\## 15. Final Principle



Bug fixing is not simply making an error disappear.



The objective is to understand why the problem occurred, correct its actual cause, preserve existing functionality, and verify the result.



\*\*Find the cause, fix it carefully, test the result, and prevent regression.\*\*

