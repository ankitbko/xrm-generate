#! /usr/bin/env node
import { Command } from 'commander';
const program = new Command();

program
.version('0.0.1')
.command('init [folder]','creates config file, adds it to .gitignore')
.command('generate [name]', 'creates a typescript class for the given entity/entities. Name is case sensitive')
.parse(process.argv);

  