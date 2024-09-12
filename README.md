![Genolink Logo](front/public/Genolink.png)

# About Genolink
Genolink is a middleware solution enabling seamless integration and interoperability between genotype databases and Genesys-PGR (genebank passport repository). Genolink is funded as part of the Australian Grains Genebank Strategic Partnership, a $30M joint investment between the Victorian State Government and Grains Research and Development Corporation (GRDC) that aims to unlock the genetic potential of plant genetic resources for the benefit of the Australian grain growers.
https://agriculture.vic.gov.au/crops-and-horticulture/the-australian-grains-genebank

# Genolink Features
- Connects genotype databases and Genesys-PGR without the need for data duplication, reducing synchronization issues and overheads.

- Provides real-time access to passport and genotype data, ensuring users always have current information.

- Allows users to filter accessions based on passport information or specified lists before retrieving related genotype data.

- Supports integration with multiple genomic platforms, enabling comprehensive data retrieval and consolidation.

- Provides APIs for independent user-facing tools like the web-based genomic visualization tool Pretzel to leverage its functionality.

- Reduces data redundancy by avoiding the need for local duplicate copies of databases.

- Streamlines the process of managing large-scale genotype data from global wheat genebanks.


# Setup Instructions

**Note:** For any placeholder values (e.g., `<your_db_username>`, `<your_db_password>`, etc.), please replace them with the correct data that you need to use.


## Manual Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14 or higher)
- NPM (version 6 or higher)
- MySQL (server and client)

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
VITE_Genesys_OIDC_AUTHORITY=https://api.sandbox.genesys-pgr.org
VITE_Genesys_OIDC_CLIENT_ID=<ask Genesys support>
VITE_Genesys_OIDC_CLIENT_SECRET=<ask Genesys support>
VITE_Genesys_OIDC_REDIRECT_URI=http://127.0.0.1:3000
VITE_GENOLINK_SERVER=http://127.0.0.1:3000
VITE_GENESYS_SERVER=https://api.sandbox.genesys-pgr.org/api/v1/acn
```

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

#### 6. Install MySQL Client and Server
Install MySQL client and server:
```bash
sudo apt install mysql-server mysql-client
```

#### 7. Create an Admin User
Open MySQL shell:
```bash
sudo mysql
```
Create a genolink user with the name "genouser":
```sql
CREATE USER '<your_db_username>'@'localhost' IDENTIFIED BY '<your_db_password>';
```

#### 8. Create a Database
Create a database with the name corresponding to your_db_name:
```sql
CREATE DATABASE <your_db_name>;
```

#### 9. Grant all previleges to the user
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
GENESYS_SERVER=https://api.sandbox.genesys-pgr.org/api/v1/acn
GENOLINK_SERVER_PORT=3000
```

#### 11. Run the Application
Start the backend server by running the following in '*back*' folder:
```bash 
node index.js
```

#### 12. Access the Application
Open your browser and navigate to http://localhost:3000 to use your application.



## Docker Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- Docker (version 20 or higher)
- Docker Compose (version 1.29 or higher)

### Option 1: Build Docker Image from Code

### Setup Steps

#### 1. Clone the Project
Clone the project repository to your local machine from GitHub:
```bash
git clone <repository_url>
```

#### 2. Edit `docker-compose.yml`:
After cloning the project, open the docker-compose.yml file. This file contains placeholders (e.g., <your_db_username>, <your_db_password>, etc.) that need to be replaced with the correct values. Make sure to fill in these placeholders with the appropriate data.

#### 3. Start Docker Containers
Navigate to the directory containing the docker-compose.yml file and run the following command to start the containers:

```bash
docker-compose up -d
```

#### 4. Access the Application
Open your browser and navigate to http://127.0.0.1:3000 to use your application.



### Option 2: Use Pre-built Docker Image from Docker Hub

### Setup Steps

#### 1. Create Docker Compose File
Create a docker-compose.yml file with the following content:

```yaml
services:
  app:
    image: <genolink-dockerhub-repo>/genolink:latest
    ports:
      - '3000:3000'
    environment:
      # Frontend-Variables
      VITE_Genesys_OIDC_AUTHORITY: 'https://api.sandbox.genesys-pgr.org'
      VITE_Genesys_OIDC_CLIENT_ID: '<ask Genesys support for your OIDC Client ID>'
      VITE_Genesys_OIDC_CLIENT_SECRET: '<ask Genesys support for your OIDC Client Secret>'
      VITE_Genesys_OIDC_REDIRECT_URI: 'http://127.0.0.1:3000'
      VITE_GENOLINK_SERVER: 'http://127.0.0.1:3000'
      VITE_GENESYS_SERVER: 'https://api.sandbox.genesys.pgr.org'
      # Backend-Variables
      DB_USERNAME: '<your_db_username>'
      DB_PASSWORD: '<your_db_password>'
      DB_NAME: '<your_db_name>'
      DB_HOST: 'db'
      DB_DIALECT: 'mysql'
      GIGWA_SERVER: '<your_gigwa_server_url>'
      GERMINATE_SERVER: '<your_germinate_server_url>'
      GENOLINK_SERVER: 'http://127.0.0.1:3000'
      GENESYS_SERVER: 'https://api.sandbox.genesys.pgr.org/api/v1/acn'
      GENOLINK_SERVER_PORT: 3000
    depends_on:
      - db
    restart: always

  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: '<your_root_password>'
      MYSQL_DATABASE: '<same_as_your_db_name>'
      MYSQL_USER: '<same_as_your_db_username>'
      MYSQL_PASSWORD: '<same_as_your_db_password>'
    ports:
      - '3307:3306'
```

#### 2. Start Docker Containers
Navigate to the directory containing the docker-compose.yml file and run the following command to start the containers:

```bash
docker-compose up -d
```
#### 3. Access the Application
Open your browser and navigate to http://127.0.0.1:3000 to use your application.

Note: The Docker image will soon be available on Docker Hub.


