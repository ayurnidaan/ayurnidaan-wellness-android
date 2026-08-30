# App Build

React Native + Expo application using Supabase for the database and authentication.

## Environment model

Use two independent Supabase projects:

- **Development**: local development, preview builds, test data, and test users.
- **Production**: App Store/Play Store releases and real user data.

Do not reuse one Supabase project for both environments. Keep database schemas in sync through versioned Supabase migrations, while data and auth users remain isolated.

The development and production apps also have different bundle/package IDs, so they can be installed on the same device. Replace `com.yourcompany.appbuild` in `app.config.ts` with the final reverse-domain identifier before the first store build.

## Local development setup

1. Install Node.js 22 LTS (the version is recorded in `.nvmrc`).
2. Run `npm install`.
3. Create a second Supabase project for development if the existing project is intended for production.
4. Copy `.env.example` to `.env.local`.
5. In the development Supabase dashboard, open **Project Settings > API** and put the project URL and publishable/anon key in `.env.local`.
6. Run `npm start` and open the project in Expo Go, or create a development build.

Only the publishable/anon key belongs in the mobile app. Never add the Supabase `service_role` key or database password. Supabase Row Level Security must protect every table exposed to the app.

## EAS cloud environments

After signing in to Expo and running `eas init`, create these variables in both the `development` and `production` EAS environments:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Use development Supabase values for the EAS development environment and production values for production. These client values are embedded in the application and should use **plain text** or **sensitive** visibility, not secret visibility.

Build commands:

```text
eas build --profile development
eas build --profile preview
eas build --profile production
```

## GitHub connection

This directory is initialized as a Git repository but has no remote yet. To connect the repository you created:

```text
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git add .
git commit -m "Set up Expo and Supabase environments"
git push -u origin master
```

If your GitHub repository uses `main`, rename the local branch before pushing with `git branch -M main`.
