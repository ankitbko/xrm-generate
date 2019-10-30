import { writeFiglet } from './figlet';
import { variables } from './ivariables';
import * as fs from 'fs';
import * as path from 'path';
var p = require('prompt');

async function init() {
    await writeFiglet();    
    
    const configfilename = '.crmdeployconfig';
    const config = await getvariablesAsync();
    const dir = path.dirname(process.cwd()) + '\\' + path.basename(process.cwd());
    config.baseurl = dir + '\\' + config.baseurl;

    fs.writeFile(dir + '\\' + configfilename, JSON.stringify(config), (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

async function getvariablesAsync(): Promise<variables> {
    return new Promise<variables>((resolve, reject) => {
        var schema = {
            properties: {
                baseurl: {
                    message: 'build folder relative to this path',
                    default: "stq_",
                    required: true
                },
                username: {
                    message: 'dyn365 username to impersonate',
                    required: true
                },
                password: {
                    hidden: true
                },
                clientid: {
                    message: 'client id of azure ad app',
                    required: true
                },
                clientsecret: {
                    required: true
                },
                resource: {
                    message: 'Resource (usually the dyn 365 instance)',
                    required: true
                },
                commonAuthority: {
                    message: "Common Authority (usually something like : 'https://login.windows.net/<<tenant>>.onmicrosoft.com/oauth2/token')",
                    required: true
                },
                apiversion: {
                    default: "8.2",
                    message: 'crm api version',
                    required: true
                },
                publisher: {
                    default: "stq_",
                    message: 'crm default publisher prefix',
                    required: true
                },
            }
        };
        p.start();
        p.get(schema, (err: any, result: any) => {
            const params: variables = {} as variables;
            for (let key in result) {
                params[key as keyof variables] = result[key];
            }
            resolve(params);
        });
    });
}

init();