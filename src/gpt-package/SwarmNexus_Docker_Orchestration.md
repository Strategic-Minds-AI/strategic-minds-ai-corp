# SwarmNexus — Docker & Container Orchestration Protocol (MAX)

This file defines the full Docker, container, and Kubernetes orchestration capability. These protocols are invoked by Docker Engineers, DevOps Engineers, and Kubernetes Architects when a task requires containerization or deployment.

---

## DOCKER BUILD PROTOCOL

### Dockerfile Writing Standards
```
🐳 DOCKERFILE STANDARDS
1. Use multi-stage builds to minimize image size
2. Pin base image versions (never use :latest)
3. Use slim/alpine/distroless bases when possible
4. Order layers from least to most frequently changing
5. Use .dockerignore to exclude unnecessary files
6. Run as non-root user
7. Set health checks
8. Clean up package manager caches in same layer
9. Use COPY over ADD (unless extracting tarballs)
10. Combine RUN commands to reduce layers
```

### Example Multi-Stage Dockerfile
```dockerfile
# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

### Build Process
```
🐳 DOCKER BUILD
Image name: [name]:[tag]
Context: [build context path]
Args: [build arguments]
Platforms: [linux/amd64, linux/arm64] (for multi-arch)

🔨 BUILD COMMAND:
docker build -t [name]:[tag] \
  --build-arg [key]=[value] \
  --platform [platforms] \
  [context]

📋 BUILD LOG: [output]
✅ VERIFY: [image exists? docker images | grep [name]]
🔍 SCAN: [vulnerability scan — Trivy/Grype]
   Result: [clean | N vulnerabilities found]
```

### Image Optimization
```
📊 IMAGE SIZE ANALYSIS
Before: [size] MB
After optimization: [size] MB
Savings: [X]%

Optimizations applied:
• Multi-stage build (removed build dependencies)
• Slim/alpine base (reduced from [X] to [Y] MB)
• Layer caching optimized
• .dockerignore added
• Package manager cache cleaned
```

---

## DOCKER RUN PROTOCOL

### Container Run Configuration
```
🐳 DOCKER RUN
Container name: [name]
Image: [image]:[tag]
Mode: [detached | interactive]

Resources:
  CPU limit: [N cores]
  Memory limit: [N MB]
  Disk limit: [N GB] (if supported)

Network:
  Network: [network name | default]
  Ports: [host:container]
  Hostname: [name]

Environment:
  Env vars: [KEY=VALUE, ...]
  Env file: [path]
  Secrets: [secret name → mount path]

Volumes:
  - [host path]:[container path]:[ro|rw]
  - [named volume]:[container path]

Health:
  Health check: [CMD to test health]
  Health interval: [Ns]
  Health timeout: [Ns]
  Health retries: [N]

Restart policy: [no | on-failure | always | unless-stopped]

🚀 RUN COMMAND:
docker run -d \
  --name [name] \
  --cpus="[N]" \
  --memory="[N]m" \
  --network [network] \
  -p [host]:[container] \
  -e [KEY]=[VALUE] \
  -v [host]:[container]:[rw|ro] \
  --health-cmd="[cmd]" \
  --health-interval=[N]s \
  --restart [policy] \
  [image]:[tag]

📋 CONTAINER ID: [id]
✅ VERIFY: [container running? docker ps | grep [name]]
🏥 HEALTH: [docker inspect --format='{{.State.Health.Status}}' [name]]
```

### Container Lifecycle Management
```
🐳 CONTAINER LIFECYCLE
Container: [name]

START: docker start [name]
STOP: docker stop [name] (graceful, 10s timeout)
KILL: docker kill [name] (immediate)
RESTART: docker restart [name]
PAUSE: docker pause [name]
UNPAUSE: docker unpause [name]
REMOVE: docker rm [name] (must be stopped first)
FORCE REMOVE: docker rm -f [name] (stops and removes)

LOGS: docker logs [name]
  Follow: docker logs -f [name]
  Last N: docker logs --tail [N] [name]
  Since: docker logs --since [timestamp] [name]

EXEC: docker exec [name] [command]
  Interactive: docker exec -it [name] /bin/sh

INSPECT: docker inspect [name]
  State: docker inspect --format='{{.State.Status}}' [name]
  IP: docker inspect --format='{{.NetworkSettings.IPAddress}}' [name]
  Health: docker inspect --format='{{.State.Health.Status}}' [name]
```

### Copying Files
```
📦 COPY TO CONTAINER:
docker cp [host_path] [name]:[container_path]

📦 COPY FROM CONTAINER:
docker cp [name]:[container_path] [host_path]
```

---

## DOCKER COMPOSE PROTOCOL

### docker-compose.yml Standards
```yaml
# docker-compose.yml
version: '3.9'

services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://db:5432/myapp
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser"]
      interval: 10s
      timeout: 5s
      retries: 5
    secrets:
      - db_password
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  db_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt

networks:
  default:
    driver: bridge
```

### Compose Lifecycle
```
🐳 COMPOSE UP:
docker-compose up -d
  📋 Services: [list of started services]
  ✅ VERIFY: [all services healthy?]

🐳 COMPOSE DOWN:
docker-compose down
  🧹 Removed: [containers, networks]
  📦 Volumes: [kept | removed with -v]

🐳 COMPOSE RESTART:
docker-compose restart [service]

🐳 COMPOSE LOGS:
docker-compose logs -f [service]

🐳 COMPOSE SCALE:
docker-compose up -d --scale [service]=[N]

🐳 COMPOSE BUILD:
docker-compose build (rebuild images)
```

---

## KUBERNETESES PROTOCOL

### Manifest Standards
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [app-name]
  labels:
    app: [app-name]
spec:
  replicas: 3
  selector:
    matchLabels:
      app: [app-name]
  template:
    metadata:
      labels:
        app: [app-name]
    spec:
      containers:
      - name: [app-name]
        image: [image]:[tag]
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
```

### K8s Operations
```
☸️ KUBERNETES OPERATIONS

APPLY: kubectl apply -f [manifest.yaml]
  ✅ VERIFY: [kubectl get pods, services, deployments]

GET STATUS:
  kubectl get pods -l app=[name]
  kubectl get services
  kubectl get deployments
  kubectl get ingress

DESCRIBE:
  kubectl describe pod [name]
  kubectl describe deployment [name]

LOGS:
  kubectl logs [pod-name]
  kubectl logs -f [pod-name] --tail=100

EXEC:
  kubectl exec -it [pod-name] -- /bin/sh

SCALE:
  kubectl scale deployment [name] --replicas=[N]

ROLL OUT:
  kubectl rollout status deployment/[name]
  kubectl rollout history deployment/[name]
  kubectl rollout undo deployment/[name]
  kubectl rollout undo deployment/[name] --to-revision=[N]

RESTART:
  kubectl rollout restart deployment/[name]

DELETE:
  kubectl delete -f [manifest.yaml]
  kubectl delete deployment [name]
  kubectl delete service [name]

PORT FORWARD (debug):
  kubectl port-forward [pod-name] [local]:[remote]

NETWORK POLICY:
  kubectl get networkpolicies
  kubectl apply -f [network-policy.yaml]

RBAC:
  kubectl get roles, rolebindings
  kubectl get clusterroles, clusterrolebindings
```

### Auto-Scaling
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: [app-name]-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: [app-name]
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### GitOps (ArgoCD)
```
🔁 GITOPS DEPLOYMENT
1. Push manifest to Git repo
2. ArgoCD detects change
3. ArgoCD syncs to cluster
4. Verify: kubectl get pods
5. Monitor rollout: kubectl rollout status
6. If failed: ArgoCD auto-rollback (or manual)
```

---

## CONTAINER SECURITY PROTOCOL

### Image Scanning
```
🔍 VULNERABILITY SCAN
Tool: [Trivy | Grype | Snyk]
Image: [name]:[tag]

Command:
  trivy image [name]:[tag]
  # or
  grype [name]:[tag]

Result:
  Critical: [N]
  High: [N]
  Medium: [N]
  Low: [N]

Action:
  • Critical/High → must fix before deploy
  • Medium → fix if possible, document if not
  • Low → track, fix in next release
```

### Security Hardening Checklist
```
🔒 CONTAINER SECURITY CHECKLIST
□ Base image pinned to specific version (no :latest)
□ Image scanned for vulnerabilities (0 critical/high)
□ Runs as non-root user
□ Read-only root filesystem (--read-only)
□ No privileged mode (--no-privileged)
□ Resource limits set (CPU, memory)
□ Network restrictions (network policies)
□ Secrets not in image (use K8s secrets or vault)
□ Image signed (Cosign)
□ No SUID/SGID bits
□ Distroless or minimal base
□ Health checks configured
□ .dockerignore excludes sensitive files
```

---

## CLEANUP PROTOCOL (ALWAYS RUN)

```
🧹 CLEANUP PROTOCOL
After every Docker/K8s operation, clean up:

1. STOP CONTAINERS:
   docker stop [container names]
   
2. REMOVE CONTAINERS:
   docker rm [container names]

3. REMOVE IMAGES (unused):
   docker image prune -a  (removes all unused images)
   # or specific:
   docker rmi [image]:[tag]

4. PRUNE NETWORKS:
   docker network prune

5. PRUNE VOLUMES (careful — removes data):
   docker volume prune  (only unused volumes)
   # NEVER: docker volume prune -a  (removes all, including named)

6. PRUNE BUILD CACHE:
   docker builder prune

7. SYSTEM PRUNE (nuclear option):
   docker system prune  (removes all unused: containers, networks, images, cache)
   # NEVER: docker system prune -a --volumes  (removes everything including volumes)

8. K8S CLEANUP:
   kubectl delete -f [manifest.yaml]
   kubectl delete namespace [namespace]  (removes everything in namespace)

✅ VERIFY CLEANUP:
   docker ps -a  (no stopped containers)
   docker images  (no unused images)
   docker volume ls  (no orphaned volumes)
```

---

## DEPLOYMENT SAFETY RULES

### Always
1. **Pin image versions** — never use `:latest` in production.
2. **Set resource limits** — CPU, memory, and disk.
3. **Configure health checks** — liveness and readiness probes.
4. **Use secrets management** — never hardcode secrets in images or manifests.
5. **Run as non-root** — least privilege.
6. **Scan images** — before deploying.
7. **Have a rollback plan** — know how to undo.
8. **Clean up** — always remove unused resources.
9. **Monitor after deploy** — check logs, metrics, health.
10. **Use GitOps** — declarative, version-controlled deployments.

### Never (without explicit user confirmation)
1. **Never run privileged containers** unless explicitly required.
2. **Never mount sensitive host paths** (/etc, /var, /root, ~/.ssh).
3. **Never expose secrets** in Dockerfiles, environment files, or manifests.
4. **Never deploy to production** without a rollback plan.
5. **Never use `:latest`** in production.
6. **Never skip health checks** in production.
7. **Never remove volumes** without confirming data loss is acceptable.
8. **Never `docker system prune -a --volumes`** without explicit confirmation.
9. **Never deploy without scanning** for vulnerabilities.
10. **Never scale to 0** in production without understanding the implications.