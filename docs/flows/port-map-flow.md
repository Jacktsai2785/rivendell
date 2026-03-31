# User Flow: Port Map Page

**Feature:** `port-map`
**Route:** `/ports` in `dashboard-next`
**Source:** `docs/requirements/port-map.md`

---

## Happy Path

```mermaid
flowchart TD
    A([User navigates to /ports]) --> B[Page loads]
    B --> C{docker-compose.yml\naccessible via API?}

    C -->|Yes| D[Parse port mappings\nfrom docker-compose.yml]
    C -->|No| ERR1[Show error banner:\ncannot read config]

    D --> E[Render port table\nwith loading spinners\nin status column]
    E --> F[Parallel: check reachability\nfor each port]

    F --> G{Port responds\nto HTTP ping?}
    G -->|Yes| H[Badge: 🟢 live]
    G -->|No| I[Badge: ⚫ stopped]
    G -->|Timeout/error| J[Badge: ❓ unknown]

    H --> K[Table fully rendered]
    I --> K
    J --> K

    K --> L{User action?}

    L -->|Click web port row| M[Open localhost:PORT\nin new tab]
    L -->|Click DB/Cache row| N[No action\nrow is non-clickable]
    L -->|Click Refresh| O[Re-run status checks\nspinners shown briefly]
    O --> F

    M --> P((Service opens in browser))
    ERR1 --> Q((Error state shown,\nno crash))
```

---

## Error & Edge Branches

```mermaid
flowchart TD
    subgraph Edge Cases
        E1[docker-compose.yml\nnot found] --> X1[Show banner:\nConfig not found]
        E2[API server down] --> X2[Show banner:\nDashboard API unreachable]
        E3[All status checks\ntimeout] --> X3[Show all rows as unknown\nnot blank/crash]
        E4[Service was stopped,\nuser clicks Refresh,\nservice now live] --> X4[Badge updates\nstopped → live]
    end
```

---

## Screen Inventory

| # | Screen / State | Purpose | Key Elements |
|---|---|---|---|
| 1 | Port Map — loading | Page skeleton while fetching | Table rows with spinner in status column |
| 2 | Port Map — populated | Main view | Port col, Service col, Container col, Status badge, Link icon |
| 3 | Port Map — error (config missing) | Config not accessible | Error banner at top, empty table body |
| 4 | Port Map — error (API down) | Dashboard API unreachable | Full-page error state |
| 5 | Status badge: live | Service reachable | Green dot + "live" text |
| 6 | Status badge: stopped | Port not responding | Grey dot + "stopped" text |
| 7 | Status badge: unknown | Check failed/timed out | Yellow dot + "unknown" text |
| 8 | Row — web service | Clickable, opens localhost:PORT | Entire row or ExternalLink icon is clickable |
| 9 | Row — DB/Cache service | Non-clickable | Link icon absent or visually disabled |
| 10 | Refresh button — active | Re-check all statuses | Spinner animation while checking |

---

## Notes

- **Status check mechanism**: the dashboard-api backend pings each port (avoids CORS issues from the browser)
- **Grouping**: rows grouped by service (news-stock: 3 ports together) with visual separator
- **Port type inference**: ports ≤ 5999 that are 5432/6379 → no-link; ports 3000–3999 → frontend; 8000–8999 → API/backend
