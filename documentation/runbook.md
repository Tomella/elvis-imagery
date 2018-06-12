# Run Book / System Operation Manual

## Service or system overview

FSDF Elvis is a suite of single page applications that are comprised of:
* Static content delivered through Apache HTTP server
* Microservices built in NodeJS
* Invoking bespoke asynchronous services running on FME server.

It depends on Explorer web services for elevation plotting (CIAP)

### Business overview

Provides a suite of simple web pages that seek to support [FSDF](http://www.anzlic.gov.au/foundation-spatial-data-framework)

### Technical overview

Elevation is predominantly a static web application with microservices provided using NodeJS as the middleware platform. The static content is served via Apache HTTP and all content is routed through the same. The microservices run in user space under the ec2-user login. It's current deployment is in AWS using a single AWS EC2 instance but the code is not bound to any particular platorm.

Future capability will include a Solr instance to serve Gazetteer place names and it will also be described in this document. If it is currently within scope is a business decision.

### Service Level Agreements (SLAs)

While no formal SLA has been negotiated it is expected that it will nearly match that of the [AWS EC2 SLA](https://aws.amazon.com/ec2/sla/) as AWS is the host system. Planned downtimes are during software releases which will be frequent (weekly to monthly) but will only result in 1 to 2 seconds per deployment during slack periods, typically in the evening. Most releases while taking roughly a second are non disruptive as changes are typically overlayed upon old deployments.

### Service owner

National Location Information Group (NLIG)
Environmental Geoscience Division
Geoscience Australia
Cnr Jerrabomberra Ave and
Hindmarsh Drive
Symonston ACT 2609

### Contributing applications, daemons, services, middleware

From least to most complex the application can be described by these parts
* Static web content served over Apache HTTP server as a numer of single page applications (SPA) using:
   * AngularJS for application framework
   * Leaflet for map rendering
   * Bootstrap for look and feel
   * D3JS for graph plotting
   * Ahngular UI Bootstrap library for richer UI
   * Explorer maps for consistant map configuration
   * Explorer UI for Explorer or Elvis common look and feel
* Microservcies provided by NodeJS [server](../server.js) where we
   * proxy to other services,
   * transform some of those servcies to easier to consume services
   * and if placenames is implemented proxy to Solr search end points to effectively firewall its console from external access
* [Proxy](../code-deploy/proxies.conf) via Apache HTTP server to external systems

The client SPA's talk directly to FME services and all end points are configured via the configuration files contained within the resources/config directory, typically named to match function.

## System characteristics

### Hours of operation

24/7 with small downtimes for releases.

### Data and processing flows

All process flows are via the web application user interaction. Most flows are passed off to FME, typically including the users' email address as a fire and forget process. Once the process is taken over by FME this system has zero interaction with the process, including no further logging.

### Infrastructure and network design

1 x AWS EC2 instance, 2 cores, 4 GB RAM, 20 GB SSD
Ports open on 80 (HTTP), 443 (HTTPS unused) and 22 (SSH)
SSH access controlled by PEM, ask the product owners for details if you are entitled to access.
An AWS elastic IP for public access
DNS entry pointing at the elastic IP

As of writing the DEV instance is [here](http://elevation.geospeedster.com) while the PROD instance is [here](http://elevation.fsdf.org.au)
It is expected that the DEV instance will be taken over by someone else but is currently routed through my (Larry Hill's) DNS while the PROD instance is managed indirectly by the product owner.

### Resilience, Fault Tolerance (FT) and High Availability (HA)

This is not a mission critical system and there is only one instance with no failover or high availabilty. It's application architecture is so light weight that it would tak a concerted effort by a denial of service (DOS) attack to bring it down.

The FME side of the system is not within the scope of this document but it is fair to state that as requests are queued it could take quite a hit before FME crashed but obviously the turnaround times for jobs would be impacted.

### Expected traffic and load

This is a niche product and usage is expected to be low, typically in the 10's to 100's page requests per day. As the application is all client based and highly cacheable there is very little chat per user session.

#### Hot or peak periods

Most traffic is expected during Australian business hours (expert users), predominantly on the eastern time zone while some traffic is expected in the evenings by hobbyists and students. Overseas interest is expected to be low.

### Environmental differences

There are no functional differences between the DEV and PROD environments other than new features are previewed in the DEV environment.

### Tools

NB. If you are going to support Place Names then the Solr instance needs to be installed and managed see [this repository](https://github.com/Tomella/gazetteer) for details.

There are a number of scripts and configuration files availble to simplify environment construction and management
* [Install dependencies](../code-deploy/install_dependencies) adds all the software packages and install services to autostart to support the application
* [Update code](../code-deploy/static_deploy) to pull from the repository and update the static code base. It also restarts the services.

## Required resources

> What compute, storage, database, metrics, logging, and scaling resources are needed? What are the minimum and expected maximum sizes (in CPU cores, RAM, GB disk space, GBit/sec, etc.)?

### Required resources - compute

1 x AWS EC2 instance, 2 cores, 4 GB RAM, 20 GB SSD

### Required resources - storage

None other than root mounted SSD

### Required resources - database

None other than Solr's internal storage hosted locally.

### Required resources - logging

Apache HTTP logs - Rolling 5 week logs for both access and errors in /etc/httpd/logs

## Security and access control

Only ports 80, 443 and 22 are open. All application services run internallly and are not exposed over any of those ports. Any services that are to be made public are proxied via configuration in Apache HTTPD configuration. See [proxy rules](../code-deploy/proxies.conf) for list.

### Password and PII security

No passwords of personal information maintained or logged

### Ongoing security checks

Occasional scanning of logs for suspicious activiy.

## System configuration

### Configuration management

The only private information are the username and password for the consumption of FME services. While not overly "secret" they are maintained in properties. The microservices that use them run under ec2-user logon and the `/home/ec2-user/.bash_profile` file exports the username and password.

```
ESRI_USERNAME=xxxxxxxxx
ESRI_PASSWORD=yyyyyyyyy

export ESRI_USERNAME
export ESRI_PASSWORD
```

The expiry is a long way off, roughly 900 days to go but if it is needed to be changed contact NLIG for instructions.

## System backup and restore
### Backup requirements

No backups are required. No single point of truth is maintained on the VM and a fresh install of the code should be the only restoration needed.

## Monitoring and alerting
### Log aggregation solution

There has been no log requirements provided. FME services has its own logging and metrics are derived from the FME logs.

Only logs are Apache HTTP logs - Rolling 5 week logs for both access and errors in /etc/httpd/logs

### Log message format

Standard Apache HTTP logging:
```xml
<IfModule log_config_module>
    #
    # The following directives define some format nicknames for use with
    # a CustomLog directive (see below).
    #
    LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
    LogFormat "%h %l %u %t \"%r\" %>s %b" common

    <IfModule logio_module>
      # You need to enable mod_logio.c to use %I and %O
      LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" %I %O" combinedio
    </IfModule>

    #
    # The location and format of the access logfile (Common Logfile Format).
    # If you do not define any access logfiles within a <VirtualHost>
    # container, they will be logged here.  Contrariwise, if you *do*
    # define per-<VirtualHost> access logfiles, transactions will be
    # logged therein and *not* in this file.
    #
    #CustomLog "logs/access_log" common

    #
    # If you prefer a logfile with access, agent, and referer information
    # (Combined Logfile Format) you can use the following directive.
    #
    CustomLog "logs/access_log" combined
</IfModule>
```

### Health checks

FME server is not part of this system and has its own halth checks as described by NLIG.

Solr can be checked by running any search against the place-names app iff it is eventually deployed. We will bolster its health checks
at some point in the future once its status is known.

#### Health of dependencies

Some partner organisations run metadata services or provide metadata links to enable provisding richer information to the user. To avoid
inconvenience to users the application degrades gradually to match the capability provided by the partner organisations. It is not the reponsibility
of this app to ensure that partner organisations maintain working capabilty but to leverage off it when they do.

## Operational tasks
### Deployment

We assume that you have set up the ESRI username and password as described above.

### First time deployment
Assuming you have ben provided with a working Red Hat like Linux distribution such as the AWS AMI image then:
* Log into the instance via SSH to a sudo capable logon like the default ec2-user account.
* Run the [first time install script](../code-deploy/install_dependencies) to add dependencies

Now the application is on the machine and ready for future deployments

### Subsequent deployments

Everything except the Solr instance for the opional place-names application is done via a second [deployment script](../code-deploy/static_deploy).
Again, login via ssh to a sudo capable logon like the default ec2-user account and run the script like:
`> bash fsdf-elvis/code-deploy/static_deploy`

Everything is updated from git, static content copied to the Apache web and the microservices restarted.

If Solr is added then see [gazetteer project](https://github.com/Tomella/gazetteer) for installing and managing it.

### Batch processing

There is no scheduled batch processing that falls under the maintenance of this application

### Power procedures

The microservices and HTTP server are both configured to auto start and have been installed and set to do so from the the first deployment of the application.

If the Solr instance is needed to be installed for the place names searhing it will self managed to do the same.

### Routine and sanity checks

As this is a non-critical system at this point in time it is left to the business owners to periodically check on the health or other wise of the system by navigating to the applications of interest at a schedule that suits their needs.

At a later date we can organise the automated health checking if that becomes a business priority.

### Troubleshooting

Typically checking the [endpoint](http://elevation.fsdf.org.au/) and following the links in the top right corner will identify if any applicaion
is broken.

Logging in and checking that the http and microservices can be done (see above). There is [script](code-deploy/start_server) that will restart both
the microservices and the http server and it is safe to do this at any point that there are slack peiods in the logs. Cycle time is less than a second
and browsers now retry a page if it doesn't load on the odd chance that a user attempts to load the page at the exact time that the cycling
occurs.

## Maintenance tasks
### Patching

Linux patching should be done at times suggested by AWS.

Patching of the application itself is not needed as a deployment is very light weight meaning a deployment is patching.

### Log rotation

There are standard apache http logs working on weekly rotation with expiry after 5 weeks. These are the main logs.

There are logs for the microservices that do minimal logging and at this point in time do not rotate. At the current rate of
filling (1 MB over 6 months) it is not a high priority to implement rotation but it should be considered if the application
is to be made more mainstream. The logs can be found:
`/var/log/fsdf.log`

## Failover and Recovery procedures
### Failover

There is no failover implemented.

### Recovery

The microservices are configured to restart on failure using [forever](https://github.com/foreverjs/forever)

See [microservices System V script](../code-deploy/fsdf) for its configuration.

A standard Apache HTTPD process pool means processes are insulated from each other for static web content.