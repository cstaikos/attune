# Supabase staging setup

Project reference: `mtlfdrkrrqxdfsjcuery`

Public connection settings are recorded in `src/environments/environment.ts`.
These values are intended for the browser; database passwords, secret keys, and
service-role keys must never be added to that file.

The application still uses `provideMockServices()`. Recording these settings does
not activate shared authentication or database persistence.

## Next implementation steps

1. Initialize the Supabase CLI workspace and local development configuration.
2. Define the schema, explicit API grants, and row-level security policies in SQL
   migrations, with separate development seed data.
3. Implement the Supabase service adapters behind the existing service contracts,
   including secure invitation redemption and verified membership.
4. Test locally, authenticate the CLI with the project owner's account, link the
   staging project, and apply the migrations.
5. Switch the application providers once shared authentication and data access are
   ready together; verify the cross-device and authorization checks in the beta plan.

The publishable key allows client API requests subject to database permissions.
It does not authorize schema deployment or project administration. CLI deployment
will need the owner's Supabase login and any database credentials requested by the
CLI, entered locally rather than committed to the repository.
