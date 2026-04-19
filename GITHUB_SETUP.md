# GitHub Setup Instructions

Follow these steps to upload your project to a new GitHub repository or update an existing one.

## 1. Initial Setup (Done for this project)

If you are starting a new project from scratch, follow these commands:

```bash
# Initialize git
git init

# Add a remote origin (replace YOUR_URL with your repo link)
git remote add origin https://github.com/meetparmar090909/Expense-Tracker.git

# Select the main branch
git branch -M main
```

## 2. Regular Workflow (How to push changes)

Whenever you make changes to your code and want to upload them to GitHub, use these three commands:

```bash
# 1. Stage all changes
git add .

# 2. Commit the changes with a message describing what you did
git commit -m "Update: improved mobile responsiveness and header layout"

# 3. Push to GitHub
git push origin main
```

## 3. Important Tips

- **Check Status**: Use `git status` to see which files are changed or not yet added.
- **Ignore Files**: Always ensure you have a `.gitignore` file so you don't upload large folders like `node_modules`.
- **First Push**: The very first time you push, use `git push -u origin main` to set up the tracking relationship. After that, just `git push` is enough.
