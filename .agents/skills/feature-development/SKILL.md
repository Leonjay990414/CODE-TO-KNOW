\---

name: feature-development

description: Develop new CODE TO KNOW features through requirement analysis, architecture inspection, implementation, testing, and documentation.

\---



\# Feature Development Skill

\# 碼上學｜CODE TO KNOW

\# 功能開發技能



\## 1. Skill Purpose



This skill defines the standard workflow for developing new features in CODE TO KNOW.



AI agents must use this workflow when implementing new pages, components, APIs, database functions, learning tools, AI capabilities, or other product features.



The objective is to ensure that every feature is consistent with the project architecture, brand identity, security requirements, and quality standards.



\## 2. Before Development



Before writing code, the AI agent must:



1\. Read the relevant project instructions.

2\. Read `AGENTS.md`.

3\. Read `PROJECT\_RULES.md`.

4\. Identify relevant files under `.agents/rules/`.

5\. Inspect the existing project structure.

6\. Check whether similar functionality already exists.

7\. Identify dependencies and possible side effects.

8\. Confirm the expected feature behavior.



Do not assume that a file, component, API, database table, or service already exists.



\## 3. Requirement Analysis



Break the feature into:



\- User goals.

\- User roles.

\- Required operations.

\- Input data.

\- Output data.

\- Business rules.

\- Permission requirements.

\- Error conditions.

\- Responsive behavior.

\- Acceptance criteria.



Identify whether the feature is intended for:



\- Students.

\- Teachers.

\- Administrators.

\- General platform visitors.



If essential requirements are unclear, ask the user before making assumptions that could change the architecture or functionality.



\## 4. Existing Architecture Inspection



Inspect the relevant parts of the project before implementation.



Check:



\- Frontend structure.

\- Backend structure.

\- API conventions.

\- Database schema.

\- Authentication.

\- Authorization.

\- Shared components.

\- Existing utilities.

\- Testing structure.

\- Environment configuration.



Reuse existing architecture when appropriate.



Do not introduce unnecessary frameworks, packages, duplicate components, or alternative implementations without a clear reason.



\## 5. Feature Planning



Before implementation, define:



1\. Feature purpose.

2\. User interaction flow.

3\. Frontend components.

4\. Backend responsibilities.

5\. API endpoints.

6\. Database changes.

7\. Permission rules.

8\. Error handling.

9\. Testing requirements.

10\. Documentation updates.



For larger features, divide implementation into smaller tasks.



Keep the implementation consistent with the existing technology stack.



\## 6. Frontend Implementation



Frontend development must follow:



\- `.agents/rules/01-brand-and-ui.md`

\- `.agents/rules/02-frontend-development.md`



Requirements:



\- Use reusable components.

\- Maintain consistent design tokens.

\- Support responsive layouts.

\- Provide loading states.

\- Provide empty states.

\- Provide error states.

\- Validate user input.

\- Maintain accessible interactions.

\- Avoid unnecessary rendering and performance problems.

\- Ensure buttons and interactive elements perform their intended actions.



The interface must follow the CODE TO KNOW brand identity.



\## 7. Backend Implementation



Backend development must follow:



\- `.agents/rules/03-backend-and-api.md`

\- `.agents/rules/04-database-and-security.md`



Requirements:



\- Validate incoming requests.

\- Verify user identity.

\- Check role permissions.

\- Apply business rules on the server.

\- Handle errors consistently.

\- Avoid exposing internal implementation details.

\- Protect sensitive information.

\- Use appropriate database operations.

\- Avoid trusting frontend-provided permissions.



Important business rules must not rely exclusively on frontend validation.



\## 8. Database Changes



Before changing database structures:



1\. Inspect the existing schema.

2\. Identify affected tables.

3\. Check relationships.

4\. Consider data migration.

5\. Preserve existing records.

6\. Define constraints and indexes where necessary.

7\. Test database operations.



Do not delete or overwrite existing data without explicit authorization.



Database changes must remain compatible with the project architecture.



\## 9. AI Feature Integration



If the feature involves AI, also follow:



`.agents/rules/05-ai-features.md`



AI functionality must:



\- Have a clear educational purpose.

\- Provide useful and understandable responses.

\- Respect staged learning assistance.

\- Avoid replacing independent student thinking.

\- Handle incomplete or uncertain information.

\- Protect student data.

\- Handle API failures and usage limits.



Do not expose API keys in frontend code.



\## 10. Testing



Follow:



`.agents/rules/06-testing-and-quality.md`



Test the feature according to its complexity.



At minimum, consider:



\- Normal operation.

\- Invalid input.

\- Missing information.

\- Unauthorized access.

\- Different user roles.

\- API failures.

\- Database failures.

\- Responsive layouts.

\- Regression risks.



Do not claim that tests passed unless they were actually executed.



\## 11. Documentation



Update relevant documentation when feature behavior, architecture, API, database structure, or user workflows change.



Possible documentation locations:



\- `docs/planning/`

\- `docs/architecture/`

\- `docs/development/`

\- `docs/testing/`



Do not create duplicate documents unnecessarily.



Documentation must describe the actual implementation, not an imagined future state.



\## 12. Git Workflow



Follow:



`.agents/rules/07-git-and-collaboration.md`



Before modifying files:



\- Check the current branch.

\- Check Git status.

\- Identify existing uncommitted changes.

\- Avoid overwriting other work.



After implementation:



\- Review modified files.

\- Run relevant tests.

\- Review the final diff.

\- Report the changes.

\- Prepare a meaningful Commit message.



Never perform destructive Git operations without explicit authorization.



\## 13. Completion Report



After implementation, provide a clear summary containing:



\### Completed

List the features actually implemented.



\### Modified Files

List the files created or modified.



\### Technical Changes

Explain important frontend, backend, API, or database changes.



\### Tests

List the tests actually executed and their results.



\### Remaining Issues

List incomplete features, known bugs, missing services, or required configuration.



\### Next Steps

Identify the most important follow-up work.



\## 14. Important Restrictions



AI agents must not:



\- Implement unrelated features without authorization.

\- Replace the existing architecture without approval.

\- Invent APIs or database structures and claim they exist.

\- Hardcode secrets.

\- Remove existing functionality unnecessarily.

\- Skip relevant tests.

\- Claim incomplete functionality is finished.

\- Modify unrelated files without a clear reason.

\- Push unreviewed changes without following project workflow.



\## 15. Final Principle



Every feature should be useful, understandable, secure, maintainable, and consistent with the CODE TO KNOW learning experience.



\*\*Understand first, plan carefully, implement systematically, test thoroughly, and document accurately.\*\*



