![Genolink Logo](front/public/Genolink.png)

# About Genolink

Genolink is a middleware solution enabling seamless integration and interoperability between genotype databases and Genesys-PGR (genebank passport repository). Genolink is funded as part of the Australian Grains Genebank Strategic Partnership, a $30M joint investment between the Victorian State Government and Grains Research and Development Corporation (GRDC) that aims to unlock the genetic potential of plant genetic resources for the benefit of the Australian grain growers.
https://agriculture.vic.gov.au/crops-and-horticulture/the-australian-grains-genebank

# Genolink Features

- Connects genotype databases and Genesys-PGR without the need for data duplication, reducing synchronization issues and overheads.

- Provides real-time access to passport and genotype data, ensuring users always have current information.

- Allows users to filter accessions based on passport information or specified lists of accessions ot specified lists of genotype ids before retrieving related genotype data.

- Supports integration with multiple genomic platforms, enabling comprehensive data retrieval and consolidation.

- Provides APIs for independent user-facing tools like the web-based genomic visualization tool Pretzel to leverage its functionality.

- Reduces data redundancy by avoiding the need for local duplicate copies of databases.

# Setup Instructions

> **Note:** For any placeholder values (e.g., `<your_db_username>`, `<your_db_password>`, etc.), please replace them with the correct data that you need to use.

## Gigwa Server Allowlist

`GIGWA_SERVERS` is required for Gigwa API access in both manual and Docker
setups. Set it in `back/.env` for a manual installation or in the project-root
`.env` file for Docker. It accepts either a JSON array of server URLs or a JSON
object whose values are server URLs. Requests for any other server are rejected
by the backend with instructions to contact the system administrator.

For one server:

```bash
GIGWA_SERVERS='["https://gigwa.example"]'
```

For multiple servers:

```bash
GIGWA_SERVERS='["https://gigwa-one.example", "https://gigwa-two.example"]'
```

## Manual Setup (Without Docker)

### Prerequisites

Make sure you have installed:

- Node.js (v20+)
- npm (v6+)
- MySQL (server & client)

### Setup Steps

#### 1. Clone the Project

Clone the project repository to your local machine from GitHub:

```bash
git clone <repository_url>
```

#### 2. Install Frontend Dependencies

Navigate to the '_front_' directory and install dependencies:

```bash
npm install
```

#### 3. Create .env File for Frontend

Create a .env file in the '_front_' directory with the following content:

```bash
GENESYS_SERVER=https://api.sandbox.genesys-pgr.org
APP_PORT=<PORT> # e.g. 3000; Express port and Vite development proxy target
BASE_PATH=<optional_base_path> # e.g. /test OR leave empty for root
GENOTYPE_MAPPING_SOURCE=hybrid_internal_first
VITE_GENOTYPE_FILTER_STATUS=no # set to yes to filter for genotyped accessions by default
```

**Genesys environment alignment**

- If you are using **Genesys sandbox**, set:
  - `GENESYS_SERVER=https://api.sandbox.genesys-pgr.org`
  - Use the **sandbox** Client ID and Secret.
- If you are using **Genesys production**, set:
  - `GENESYS_SERVER=https://api.genesys-pgr.org`
  - Use the **production** Client ID and Secret.

> **Note:** To obtain the correct Genesys OIDC Client ID and Secret for your Genolink server address (e.g. your domain or local 127.0.0.1:3000), please contact the [Genesys support team](https://www.genesys-pgr.org/content/about/contact).
> Sandbox and production have **different** Client IDs and Secrets. Make sure the URL and credentials belong to the same Genesys environment.

#### 4. Build Frontend

Build the frontend and move the generated '_dist_' folder to the backend's root directory:

```bash
npm run build
mv dist ../back/
```

#### 5. Install Backend Dependencies

Navigate to the _back_ directory and install dependencies:

```bash
npm install
```

#### 6. Install and configure MySQL:

\_Install MySQL server and client for your OS
\_Start MySQL server
\_Create a database user and database:

```sql
CREATE USER '<your_db_username>'@'localhost' IDENTIFIED BY '<your_db_password>';
CREATE DATABASE <your_db_name>;
```

#### 7. Grant all previleges to the user

```sql
GRANT ALL PRIVILEGES ON <your_db_name>.* TO '<your_db_username>'@'localhost';
FLUSH PRIVILEGES;
```

#### 10. Create .env File for Backend

Create a .env file in the 'back' directory with the following content:

```bash
DB_USERNAME=<your_db_username>
DB_PASSWORD=<your_db_password>
DB_NAME=<your_db_name>
DB_HOST=localhost
DB_DIALECT=mysql
GIGWA_SERVERS='["https://your-gigwa-server.example"]'
GENESYS_SERVER=https://api.sandbox.genesys-pgr.org
GENESYS_CLIENT_ID=<your_Genesys_client_id>
GENESYS_CLIENT_SECRET=<your_Genesys_client_secret>
GENOLINK_ORIGIN=https://your-genolink.example # public origin registered with Genesys
APP_PORT=<PORT> # e.g. 3000
JSON_BODY_LIMIT=100mb # optional; maximum incoming JSON request size
EXPORT_MAX_CONCURRENT=2 # optional; simultaneous exports per backend process
EXPORT_UPSTREAM_TIMEOUT_MS=30000 # optional; timeout for each Gigwa export request
EXPORT_TOTAL_TIMEOUT_MS=600000 # optional; timeout for the complete export
EXPORT_POLL_INTERVAL_MS=2000 # optional; delay between ZIP readiness checks
```

#### 11. Run the Application

Start the backend server by running the following in '_back_' folder:

```bash
node index.js
```

#### 12. Access the Application

Open your browser and navigate to http://localhost:3000 to use your application.

## Docker Setup (Recommended)

### Prerequisites

Make sure you have installed:

- Docker (v20+)
- Docker Compose (v1.29+)

### Setup Steps

#### 1. Clone the Project

Clone the project repository to your local machine from GitHub:

```bash
git clone <repository_url>
```

#### 2. Create a .env file in the project root:

Example .env content:

```bash
DB_ROOT_PASSWORD=<your_root_mysql_password>
DB_USERNAME=<your_db_username>
DB_PASSWORD=<your_db_password>
DB_NAME=<your_db_name>
DB_HOST=db
DB_DIALECT=mysql
GIGWA_SERVERS='["https://your-gigwa-server.example"]'
GENESYS_SERVER=https://api.sandbox.genesys-pgr.org
GENOLINK_ORIGIN=https://your-genolink.example # public origin registered with Genesys
APP_PORT=<PORT> # e.g. 3000
DB_PORT=<PORT> # e.g. 3306
JSON_BODY_LIMIT=100mb # optional; maximum incoming JSON request size
EXPORT_MAX_CONCURRENT=2 # optional; simultaneous exports per backend process
EXPORT_UPSTREAM_TIMEOUT_MS=30000 # optional; timeout for each Gigwa request
EXPORT_TOTAL_TIMEOUT_MS=600000 # optional; timeout for the complete export
EXPORT_POLL_INTERVAL_MS=2000 # optional; delay between ZIP readiness checks
GENESYS_CLIENT_ID=<your_Genesys_client_id>
GENESYS_CLIENT_SECRET=<your_Genesys_client_secret>
GENOTYPE_MAPPING_SOURCE=hybrid_internal_first
VITE_PLATFORM=Gigwa
VITE_REQUIRE_GIGWA_CREDENTIALS=true
VITE_GENOTYPE_FILTER_STATUS=no # set to yes to filter for genotyped accessions by default
BASE_PATH=<optional_base_path> # e.g. /test OR leave empty for root
```

**Genesys environment alignment**

- If you are using **Genesys sandbox**, set:
  - `GENESYS_SERVER=https://api.sandbox.genesys-pgr.org`
  - Use the **sandbox** Client ID and Secret.
- If you are using **Genesys production**, set:
  - `GENESYS_SERVER=https://api.genesys-pgr.org`
  - Use the **production** Client ID and Secret.

> **Note:** To obtain the correct Genesys OIDC Client ID and Secret for your Genolink server address (e.g. your domain or local 127.0.0.1:3000), please contact the [Genesys support team](https://www.genesys-pgr.org/content/about/contact).
> Sandbox and production have **different** Client IDs and Secrets. Make sure the URL and credentials belong to the same Genesys environment.

#### 3. Start Docker Containers

Navigate to the directory containing the docker-compose.yml file and run the following command to start the containers:

```bash
docker-compose up -d
```

#### 4. Access the Application

Open your browser and navigate to your_genolink_domain to use your application.
