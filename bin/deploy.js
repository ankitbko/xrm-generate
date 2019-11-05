#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
program
    .version('0.0.1')
    .command('init [folder]', 'creates config file, adds it to .gitignore')
    .command('generate [name]', 'creates a typescript class for the given entity/entities. Name is case sensitive')
    .parse(process.argv);
//# sourceMappingURL=deploy.js.map