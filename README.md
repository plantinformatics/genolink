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

## Manual Setup (Without Docker)

### Prerequisites

Make sure you have installed:
- Node.js (v14+)
- npm (v6+)
- MySQL (server & client)

### Setup Steps

#### 1. Clone the Project
Clone the project repository to your local machine from GitHub:
```bash
git clone <repository_url>
```

#### 2. Install Frontend Dependencies
Navigate to the '*front*' directory and install dependencies:
```bash
npm install
```

#### 3. Create .env File for Frontend
Create a .env file in the '*front*' directory with the following content:
```bash
VITE_Genesys_OIDC_CLIENT_ID=<your_client_id>
VITE_Genesys_OIDC_CLIENT_SECRET=<your_client_secret>
VITE_GENOLINK_SERVER=http://127.0.0.1:3000
VITE_GENESYS_SERVER=https://api.genesys-pgr.org
```
> **Note:** To obtain your Genesys OIDC Client ID and Secret, please contact the [Genesys support team](https://www.genesys-pgr.org/content/about/contact).


#### 4. Build Frontend
Build the frontend and move the generated '*dist*' folder to the backend's root directory:
```bash
npm run build
mv dist ../back/
```

#### 5. Install Backend Dependencies
Navigate to the *back* directory and install dependencies:
```bash
npm install
```

#### 6. Install and configure MySQL:
_Install MySQL server and client for your OS
_Start MySQL server
_Create a database user and database:

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
GIGWA_SERVER=<your_gigwa_server_url>
GERMINATE_SERVER=<your_germinate_server_url>
GENOLINK_SERVER=http://127.0.0.1:3000
GENESYS_SERVER=https://api.genesys-pgr.org
GENOLINK_SERVER_PORT=3000
```

#### 11. Run the Application
Start the backend server by running the following in '*back*' folder:
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
GENOLINK_SERVER=<your_genolink_domain> # e.g. https://genolink.plantinformatics.io
GENESYS_SERVER=https://api.sandbox.genesys-pgr.org
GENOLINK_SERVER_PORT=5006
VITE_Genesys_OIDC_CLIENT_ID=<your_Genesys_client_id>
VITE_Genesys_OIDC_CLIENT_SECRET=<your_Genesys_client_secret>
VITE_GENOLINK_SERVER=<your_genolink_domain> # e.g. https://genolink.plantinformatics.io
VITE_GENESYS_SERVER=https://api.sandbox.genesys-pgr.org
VITE_PLATFORM=Gigwa
VITE_REQUIRE_GIGWA_CREDENTIALS=true
BASE_PATH=<optional_base_path> # e.g. /test OR leave empty for root
```
> **Note:** To obtain your Genesys OIDC Client ID and Secret, please contact the [Genesys support team](https://www.genesys-pgr.org/content/about/contact).


#### 3. Start Docker Containers
Navigate to the directory containing the docker-compose.yml file and run the following command to start the containers:

```bash
docker-compose up -d
```

#### 4. Access the Application
Open your browser and navigate to http://127.0.0.1:3000 to use your application.


