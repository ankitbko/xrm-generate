# xrm-generate
Auto generate typescript files for XRM Entities. This is based upon https://www.npmjs.com/package/dyn365-deploy-cli

![npm (tag)](https://img.shields.io/npm/v/xrm-generate/latest?color=green&style=for-the-badge)

### Description

I wanted to change some parts of auto-generated files in dyn365-deploy-cli but couldn't find any place where the code is open sourced so I took the liberty to take some part of their code and modified it for my personal need. Since this project is released under ISC licence (same as dyn365-deploy-cli) feel free to modify it for your need.

This project removes dependency to crm-common-js which still uses XRM.Page internally. Instead Xrm `FormContext` is passed as dependency to generated classes. 

### How to run

```
xrm init
```
Generate config similar to dyn365-deploy-cli. Contains password in plaintext so it is not meant to be commited in repoistory. Add the generated file to .gitignore

```
xrm generate <entity-name>
```

Generates 2 `Entity` classes. One for WebAPi calls and other for CRM Form. The *form* class encapsulates common methods to interact with CRM form. Read dyn365-deploy-cli *generate* document for more details.


### TODO
- Change Authenticaiton method from username-password to Application User (client-secret).
- Add configuration to change the output directory.
- Allow user to modify template.


Currently I have no plan to make any more changes to this project. Please feel free to raise PR for any new feature or bugs.
