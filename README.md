# VideoCutTool

An online tool to cut/trim videos in Wikimedia commons.

See live demo at: [VideoCutTool](https://videocuttool.wmcloud.org/)

## Learn More

You can learn more in the [VideoCutTool page](https://commons.wikimedia.org/wiki/Commons:VideoCutTool).

## Installation

To set up the tool on your local machine, follow these steps

### Get OAuth2.0 Credentials

Go to:
<https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose>.

Create an application with the following grants:

- Edit existing pages.
- Create, edit, and move pages.
- Upload new files.
- Upload, replace, and move files.

### Setting the CallBack URL

If it's for production, use call back URL as:
<https://videocuttool.wmcloud.org/api/auth/mediawiki/callback>

If it's for development, use call back URL as:
<http://localhost:8000/api/auth/mediawiki/callback>

### Creating .env file

Store the obtained Client ID, and Client Secret, in the `.env` file, under the keys `CLIENT_ID`, and `CLIENT_SECRET` respectively.

Name the file as `.env.dev` if its for development, or `.env.prod` if its for production.

Note: These files should follow the format, given in the `.env.example` file

### Running locally

The tool uses Docker to install and run everything with a single command.

Install Docker from this link: <https://docs.docker.com/get-docker/>

#### Clone Repo

Run these commands to clone the code from the remote repo:

```
git clone "https://gerrit.wikimedia.org/r/labs/tools/VideoCutTool"

cd ./VideoCutTool
```

#### Database

##### On a development system

- View the users list using the following commands:
  - Connect to postgresql using `psql --host=0.0.0.0 --port=5435 --dbname=videocuttool --username=videocuttool`
  - Enter the password (by default it is set to `videocuttool`)
  - Run `select * from Users;`
- View the list of videos being edited/that have been processed:
  - Connect to postgresql using `psql --host=0.0.0.0 --port=5435 --dbname=videocuttool --username=videocuttool`
  - Enter the password (by default it is set to `videocuttool`)
  - Run `select * from Videos;`

#### Run environment

Run this command inside VideoCutTool to start development Docker container, if you operating system is Windows

```
docker-compose -f .\docker-compose.dev.yml up --build -V
```

If your operating system is other than Windows (Linux/Mac), run this command instead

```
docker-compose -f ./docker-compose.dev.yml up --build -V
```

The first time you run it will take some time (4-8 minutes depending on your internet speed) because it will pull the necessary images from Docker and install NPM packages. Once it is up and running changes will be hot loaded.

> Note: Anytime you update package.json the build process will take a while.

To run production you can run this command:

```
docker-compose -f .\docker-compose.prd.yml up -d
```

for windows

and

```
docker-compose -f ./docker-compose.prd.yml up -d
```

for other operating systems.

You are now good to go, and should have successfully set up the tool on your local machine for development. If you encounter any error while setting this up locally, do checkout our tickets on [phabricator](https://phabricator.wikimedia.org/tag/videocuttool/), if you could find something relevant there.

> Note: If are facing errors specific to `mediawikiId`, please have a look [here](https://phabricator.wikimedia.org/T331247)

### Connecting to Cloud VPS Servers

If you want to set up cloud services for production, follow here:

Cloud VPS Horizon URL: <https://horizon.wikimedia.org>

- videocuttool instance using `ssh -J <username>@primary.bastion.wmflabs.org <username>@videocuttool.videocuttool.eqiad1.wikimedia.cloud`
- nc-videocuttool instance using `ssh -J <username>@primary.bastion.wmflabs.org <username>@nc-videocuttool.videocuttool.eqiad1.wikimedia.cloud`

#### Installing VideoCutTool in cloud server

To install the tool in the cloud server (production), follow here

Install the following utilities:

- git
- docker

### Setting up beta version

Set up your Cloud VPS Horizon, from the above tutorial.

beta-videocuttool instance using `ssh -J <username>@primary.bastion.wmflabs.org <username>@beta-videocuttool.videocuttool.eqiad1.wikimedia.cloud`

> where _username_ is your gerrit-authorized username

After setting up the cloud, set up Crontab, for syncing your beta with the current master

- Create a file for storing the logs

```sh
sudo mkdir /app/logs
```

```sh
sudo touch /app/logs/beta.log
```

- Create a crontab for the root user

```sh
sudo crontab -e
```

opens the Cron-tab for the root user, and paste the below line on the editor

```s
0 * * * * /app/VideoCutTool/server-sync.sh >> /app/logs/beta.log
```

> Note: The above line runs the server-sync.sh file at every hour.

If you couldn't find `/app/VideoCutTool` in the server instance, go ahead and install dependencies like

- Git
- [Docker Engine](https://docs.docker.com/engine/install/debian/)
- Vim/Nano (Based on preference)

via `apt` or some other package manager you prefer.

- After installing these, go to `/app`, and use the above `git pull` command to get the repository on the beta-server
- Now follow the above steps to set up crontab.
- Make sure to run all the docker commands in the detached mode, via the -d flag

If you face any issues regarding setting up beta instance, feel free to raise your queries on [phabricator](https://phabricator.wikimedia.org/tag/videocuttool/), or contact us via Zulip.

### Apply patches at the server

- Switch to root user `sudo -i`
- cd `/app/VideoCutTool`
- Sync to the master using `./server-sync.sh`

### Acknowledgments

VideoCutTool owes its existence to the dedication and collaborative efforts of several individuals who have played crucial roles in its development and maintenance:

Gopa Vasanth (@Gopavasanth on phabricator.wikimedia.org): The original creator of VideoCutTool, Gopa Vasanth initiated the project during the 2019 Google Summer of Code under the mentorship of Pratik Shetty, Hassan Amin, and James Heilman.

Khr2003: A co-maintainer of the tool, Khr2003 significantly contributed to the project by revamping the code base during their tenure.

Sohom Datta (@soda on phabricator.wikimedia.org): Joining as a co-maintainer during the Google Summer of Code 2023, Sohom Datta served as a mentor to the project, further advancing the tool's development.

Punith and Varun: These contributors made valuable contributions to VideoCutTool as part of the Google Summer of Code 2023. Their dedication and input led them to become co-maintainers of the tool.

The collaborative efforts of these individuals have shaped VideoCutTool into a powerful and efficient tool for its users.
