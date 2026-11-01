
# Movexa — Contribution Guidelines

## 1. General Rules

- Always work on your assigned feature or task.
- Do not directly modify the main branch.
- Pull the latest changes before starting new work.
- Keep commits small and meaningful.
- Do not upload passwords, API keys, database credentials or `.env` files.
- Do not modify another module without coordinating with its owner.

## 2. Branch Naming

Use the following conventions:

- feature/feature-name — New functionality
- fix/issue-name — Bug fixes
- chore/task-name — Configuration and maintenance
- docs/topic-name — Documentation

Examples:

- feature/login
- feature/exercise-session
- fix/camera-permission
- chore/project-setup

## 3. Commit Message Format

Use clear commit messages:

- feat: add user authentication
- fix: resolve camera permission issue
- docs: update project documentation
- chore: configure project structure
- test: add movement analysis tests

## 4. Pull Request Rules

Before merging into main:

1. Push your working branch.
2. Create a Pull Request.
3. Explain what was changed.
4. Test the changes.
5. Request review from the team lead or designated reviewer.
6. Merge only after approval.

## 5. Code Quality

- Use meaningful variable and function names.
- Keep components and functions focused.
- Avoid unnecessary duplicate code.
- Add comments where logic is not obvious.
- Test your changes before submitting a Pull Request.

## 6. Security and Patient Data

- Never commit real patient information.
- Do not store raw camera recordings by default.
- Protect authentication credentials and sensitive session data.
- Use synthetic data for development and testing.

## 7. Communication

- Inform the team before changing shared interfaces or database schemas.
- Report blockers early.
- Coordinate dependencies between frontend, backend and AI modules.
