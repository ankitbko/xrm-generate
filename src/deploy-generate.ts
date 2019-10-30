import { MetadataResponse, MetadataContents } from './models/MetadataResponse';
import { OptionsetMetadata } from './models/OptionsetMetadata';
import { EntityMetadata } from './models/EntityMetadata';
import { getAccessToken } from './functions';
import { writeFiglet } from './figlet';
import readConfig from './readconfig';
import { default as axios } from 'axios';
import * as CLI from 'clui';
import { Command } from 'commander';
import * as fs from 'fs';

const program = new Command();

var domainroot: string;
var spinner: any = null;
var baseurl: string = '';
var apiversion: string = '';
var accesstoken: string;
var modelroot: string = '';
async function generate(filenameparams: string[] = []): Promise<void> {
  try {
    modelroot = __dirname.split('\\bin')[0] + '\\src\\models\\';
    await writeFiglet();
    var config = await readConfig();
    accesstoken = await getAccessToken(config);
    baseurl = config.resource;
    apiversion = config.apiversion;
    spinner = new CLI.Spinner('Working');
    spinner.start();

    var srcroot = config.root + '\\src';
    if (!fs.existsSync(srcroot)) fs.mkdirSync(srcroot);

    domainroot = srcroot + '\\domain\\';
    if (!fs.existsSync(domainroot)) fs.mkdirSync(domainroot);
    domainroot = domainroot + 'model\\';
    if (!fs.existsSync(domainroot)) fs.mkdirSync(domainroot);

    await writeBaseFile();
    var modelrequests = filenameparams.map(name => composeModel(name));

    var models = (await Promise.all(modelrequests).catch(e => {
      console.log(e);
      return;
    })) as Model[];

    models.forEach(model => writeModelFile(model));

    spinner.stop();
  } catch (e) {
    console.log(e);
  }
}

class Model {
  name: string | undefined;
  content: string | undefined;

  constructor(partial?: Partial<Model>) {
    Object.assign(this, partial);
  }
}

async function composeModel(entityname: string): Promise<Model | undefined> {
  try {
    const metadatacontent = await getMetadataResponse(entityname);
    if (!metadatacontent) {
      return;
    }
    var optionsets = await getOptionSets(metadatacontent.MetadataId);
    var metadata = await getEntityMetadata(metadatacontent.MetadataId);
    var label = metadatacontent.DisplayName.LocalizedLabels.filter(x => x.LanguageCode == 1033)[0];
    if (!label) {
      label = metadatacontent.DisplayName.LocalizedLabels[0];
    }

    entityname = clean(label.Label);
    var model = getObjectModel(metadata, entityname, metadatacontent.EntitySetName, metadatacontent.LogicalName, optionsets);

    return model;
  } catch (e) {
    console.log(e);
  }
}

async function writeBaseFile(): Promise<void> {
  let readStream = fs.createReadStream(modelroot + 'base.ts');
  readStream.once('error', err => {
    console.log(err);
    throw err;
  });

  readStream.once('end', () => {
    console.log(domainroot + 'Base.ts was generated');
    return;
  });

  readStream.pipe(fs.createWriteStream(domainroot + 'Base.ts'));
}

class AttributeMapp {
  attributeType: string | undefined;
  typeRepresentation: string | undefined;
}

const attributeTypeWhitelist = [
  { attributeType: 'String', typeRepresentation: 'string' },
  { attributeType: 'Integer', typeRepresentation: 'number' },
  { attributeType: 'Memo', typeRepresentation: 'string' },
  { attributeType: 'Picklist', typeRepresentation: 'number' },
  { attributeType: 'Uniqueidentifier', typeRepresentation: 'string' },
  { attributeType: 'Boolean', typeRepresentation: 'boolean' },
  { attributeType: 'Double', typeRepresentation: 'number' },
  { attributeType: 'Money', typeRepresentation: 'number' },
  { attributeType: 'DateTime', typeRepresentation: 'Date' },
] as AttributeMapp[];

function GenerateOptionsets(optionsets: OptionsetMetadata): string {
  var rows: string[] = [];
  optionsets.value.forEach(optionset => {
    rows.push(`export enum ${optionset.LogicalName} {`);
    if (optionset.GlobalOptionSet) {
      optionset.GlobalOptionSet.Options.forEach(option => {
        var label = option.Label.LocalizedLabels.filter(x => (x as any).LanguageCode == 1033)[0];
        if (!label) {
          label = option.Label.LocalizedLabels[0];
        }
        var cleanlabel = clean((label as any).Label);
        rows.push(` ${cleanlabel} = ${option.Value},`);
      });
    } else if (optionset.OptionSet) {
      optionset.OptionSet.Options.forEach(option => {
        var label = option.Label.LocalizedLabels.filter(x => (x as any).LanguageCode == 1033)[0];
        if (!label) {
          label = option.Label.LocalizedLabels[0];
        }
        var cleanlabel = clean(label.Label);
        rows.push(` ${cleanlabel} = ${option.Value},`);
      });
    }
    rows.push('}');
    rows.push('');
  });
  return rows.join('\n');
}

function clean(string: string) {
  var reg = /[a-zA-Z0-9_]+/g;

  var clean = string.match(reg);
  if (clean == null || clean.length < 1) return 'undefined';
  var cleanstring = clean.join('');
  if (!isNaN(parseInt(cleanstring.charAt(0)))) return 'enum' + cleanstring;

  return cleanstring;
}

function getFormModel(metadata: EntityMetadata, entityname: string, optionsets: OptionsetMetadata): string {
  var arr = [];
  arr.push(`export class ${entityname}Form {`);
  arr.push('');
  arr.push('  constructor(private formContext: Xrm.FormContext) { }');
  arr.push('');
  metadata.Attributes.filter(
    a =>
      (a.DisplayName.LocalizedLabels.length > 0 && a.Targets != null) ||
      attributeTypeWhitelist.some(m => m.attributeType === a.AttributeType),
  ).forEach(attr => {
    if (attr.AttributeType == 'Picklist') {
      arr.push(
        `  ${attr.LogicalName}: CrmProp<${attr.LogicalName}> = new CrmProp<${attr.LogicalName}>("${attr.LogicalName}", this.formContext)`,
      );
    } else if (attr.Targets != null) {
      arr.push(
        `  ${attr.LogicalName}: CrmProp<EntityReference[]> = new CrmProp<EntityReference[]>("${attr.LogicalName}", this.formContext)`,
      );
    } else {
      var type = attributeTypeWhitelist.filter(x => x.attributeType === attr.AttributeType)[0];
      if (type) {
        arr.push(
          `  ${attr.LogicalName}: CrmProp<${type.typeRepresentation}> = new CrmProp<${type.typeRepresentation}>("${attr.LogicalName}", this.formContext)`,
        );
      }
    }
  });
  arr.push(`}`);
  arr.push('');

  return arr.join('\n');
}

function getObjectModel(
  metadata: EntityMetadata,
  entityname: string,
  setname: string,
  logicalName: string,
  optionsets: OptionsetMetadata,
): Model {
  var arr: string[] = [];
  arr.push("import { CrmProp, EntityReference, IEntity } from './Base'");
  arr.push('');
  arr.push(GenerateOptionsets(optionsets));
  arr.push(`export class ${entityname} implements IEntity {`);
  arr.push(`  getSetName(): string { return "${setname}" };`);
  arr.push(`  getLogicalName(): string { return "${logicalName}" };`);

  metadata.Attributes.filter(
    a =>
      (a.DisplayName.LocalizedLabels.length > 0 && a.Targets != null) ||
      attributeTypeWhitelist.some(m => m.attributeType === a.AttributeType),
  ).forEach(attr => {
    if (attr.AttributeType == 'Picklist') {
      arr.push(`  ${attr.LogicalName}!: ${attr.LogicalName};`);
    } else if (attr.Targets != null) {
      arr.push(`  _${attr.LogicalName}_value!: string`);
    } else {
      var type = attributeTypeWhitelist.filter(x => x.attributeType === attr.AttributeType)[0];
      if (type) {
        arr.push(`  ${attr.LogicalName}!: ${type.typeRepresentation};`);
      }
    }
  });
  arr.push(`}`);
  arr.push('');

  arr.push(getFormModel(metadata, entityname, optionsets));
  return new Model({
    name: entityname,
    content: arr.join('\n'),
  });
}

async function getOptionSets(metadataid: string): Promise<OptionsetMetadata> {
  try {
    const response = await axios.get(
      `${baseurl}/api/data/v${apiversion}/EntityDefinitions(${metadataid})/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`,
      {
        headers: {
          'cache-control': 'no-cache',
          authorization: `Bearer ${accesstoken}`,
          'content-type': 'application/json',
        },
        params: {
          $select: 'LogicalName',
          $expand: 'OptionSet,GlobalOptionSet',
        },
      },
    );
    return response.data as OptionsetMetadata;
  } catch (e) {
    console.log(e);
    throw e;
  }
}

async function getEntityMetadata(metadataid: string): Promise<EntityMetadata> {
  try {
    const response = await axios.get(`${baseurl}/api/data/v${apiversion}/EntityDefinitions(${metadataid})`, {
      headers: {
        'cache-control': 'no-cache',
        authorization: `Bearer ${accesstoken}`,
        'content-type': 'application/json',
      },
      params: {
        $expand: 'Attributes',
        $select: 'Attributes',
      },
    });
    return response.data as EntityMetadata;
  } catch (e) {
    console.log(e);
    throw e;
  }
}

async function getMetadataResponse(entityname: string): Promise<MetadataContents> {
  try {
    const response = await axios.get(`${baseurl}/api/data/v${apiversion}/EntityDefinitions`, {
      headers: {
        'cache-control': 'no-cache',
        authorization: `Bearer ${accesstoken}`,
        'content-type': 'application/json',
      },
      params: {
        $select: 'DisplayName,IsKnowledgeManagementEnabled,EntitySetName,LogicalName',
        $filter: `EntitySetName eq '${entityname}'`,
      },
    });
    var body = response.data as MetadataResponse;
    if (body.value.length < 1) throw new Error('could not find entity with entitysetname eq ' + entityname);
    else if (body.value.length > 1)
      throw new Error(`ambiguous reponse, found ${body.value.length} entities with entitysetname eq ${entityname}`);
    else return body.value[0];
  } catch (e) {
    console.log(e);
    throw e;
  }
}

// async function writeOptionsetFile(optionsetname, content): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//         fs.writeFile(domainroot + '\\optionset\\' + optionsetname + ".ts", content, (e) => {
//             if (e) {
//                 console.log(e);
//                 reject();
//                 return;
//             }
//             resolve();
//         });
//     });

// }

function writeModelFile(model: Model) {
  if (!model) return;
  fs.writeFile(domainroot + model.name + '.ts', model.content, e => {
    if (e) console.log(e);
    else console.log(domainroot + model.name + '.ts' + ' war generated');
  });
}

program.parse(process.argv);
try {
  generate(program.args);
} catch (e) {}
