import figlet from 'figlet';
import chalk from 'chalk';

export async function writeFiglet(): Promise<void> {
  figlet('xrm-generate', (err, crmdata = '') => {
    console.log(chalk.blue(crmdata));
  });
}
