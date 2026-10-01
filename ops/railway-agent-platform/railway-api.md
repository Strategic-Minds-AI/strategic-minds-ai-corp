# Railway Agent Environment API Contract

Endpoint: `https://backboard.railway.com/graphql/v2`

Project: `15f90272-e2f6-4739-8286-91447f545d71`  
Staging source: `d829fb35-5cdf-47a2-bd4f-134a1cf336d4`

Use an account/workspace API token with `Authorization: Bearer ...` for a controller that creates environments. A Railway project token is environment-scoped and uses `Project-Access-Token`.

## List environments

```graphql
query Environments($projectId: String!) {
  environments(projectId: $projectId) {
    edges { node { id name createdAt } }
  }
}
```

Variables:
```json
{"projectId":"15f90272-e2f6-4739-8286-91447f545d71"}
```

## Create an agent environment by cloning staging

```graphql
mutation CreateAgentEnvironment($input: EnvironmentCreateInput!) {
  environmentCreate(input: $input) { id name }
}
```

Variables example:
```json
{
  "input": {
    "projectId": "15f90272-e2f6-4739-8286-91447f545d71",
    "name": "sandbox-orchestrator",
    "sourceEnvironmentId": "d829fb35-5cdf-47a2-bd4f-134a1cf336d4",
    "skipInitialDeploys": true
  }
}
```

Before relying on optional fields, introspect the live schema:
```powershell
railway api describe EnvironmentCreateInput
```

## Delete an environment

```graphql
mutation DeleteEnvironment($id: String!) {
  environmentDelete(id: $id)
}
```

## Create the staging worker service

```graphql
mutation CreateWorker($input: ServiceCreateInput!) {
  serviceCreate(input: $input) { id name }
}
```

Variables:
```json
{
  "input": {
    "projectId": "15f90272-e2f6-4739-8286-91447f545d71",
    "environmentId": "d829fb35-5cdf-47a2-bd4f-134a1cf336d4",
    "name": "agent-worker",
    "branch": "convergence/unified-sync-fabric-20261001",
    "source": {"repo":"Strategic-Minds-AI/strategic-minds-ai-corp"}
  }
}
```

Then configure the service instance root directory and health check:
```graphql
mutation ConfigureWorker(
  $serviceId: String!,
  $environmentId: String!,
  $input: ServiceInstanceUpdateInput!
) {
  serviceInstanceUpdate(
    serviceId: $serviceId,
    environmentId: $environmentId,
    input: $input
  )
}
```

Variables:
```json
{
  "serviceId": "<agent-worker-service-id>",
  "environmentId": "d829fb35-5cdf-47a2-bd4f-134a1cf336d4",
  "input": {
    "rootDirectory": "/ops/railway-agent-platform/worker",
    "healthcheckPath": "/health",
    "startCommand": "node src/worker.mjs"
  }
}
```

## Set worker variables

```graphql
mutation SetWorkerVariables($input: VariableCollectionUpsertInput!) {
  variableCollectionUpsert(input: $input)
}
```

Non-secret example:
```json
{
  "input": {
    "projectId": "15f90272-e2f6-4739-8286-91447f545d71",
    "environmentId": "<environment-id>",
    "serviceId": "<agent-worker-service-id>",
    "variables": {
      "AGENT_NAME": "orchestrator",
      "BASE44_SANDBOX_AUTH_URL": "https://strategic-ai-consulting.base44.app/functions/sandboxAuth",
      "SANDBOX_RUNTIME": "railway_environment",
      "POLL_INTERVAL_MS": "5000",
      "HEARTBEAT_INTERVAL_MS": "30000",
      "TASK_TIMEOUT_MS": "600000",
      "ALLOW_SHELL_TASKS": "false"
    }
  }
}
```

`SANDBOX_API_KEY` is a secret and must be written via a provider-native secret path; never commit or log it.

If each agent has its own database, set `DATABASE_URL` to the agent database/reference in that environment. If the Railway database service is cloned with the environment, prefer a Railway reference such as `${{Postgres.DATABASE_URL}}`.

## Deploy

```graphql
mutation DeployWorker($serviceId: String!, $environmentId: String!) {
  serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
}
```

Use live introspection before production automation:
```powershell
railway api describe serviceInstanceDeploy
railway api describe VariableCollectionUpsertInput
railway api describe ServiceInstanceUpdateInput
```

## Environment event synchronization

Railway project webhooks are for deployment-status changes and alerts, not environment-create/delete lifecycle events.

Therefore:
1. Base44 `manageSandboxes` creates/deletes the Railway environment.
2. On successful mutation it writes the corresponding Base44 Sandbox record in the same request.
3. A five-minute reconciler lists Railway environments and repairs drift for out-of-band dashboard changes.
4. Railway webhooks are used for deployment state only.

Do not treat webhook delivery as source truth; reconciliation is authoritative.
