import { variables } from './ivariables';
import * as path from 'path';
import * as fs from 'fs';

export default async function readConfig(): Promise<variables> {
    return new Promise<variables>((resolve, reject) => {
        var sourcepath = path.dirname(process.cwd()) + '\\' + path.basename(process.cwd()) + '\\.crmdeployconfig';
        var file = fs.readFile(sourcepath, 'utf8', (err, data) => {
            var cfg = JSON.parse(data) as variables;
            cfg.root = path.dirname(process.cwd()) + '\\' + path.basename(process.cwd());
            resolve(cfg);
        });

    });
}