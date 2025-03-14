import yargs, { CommandModule } from 'yargs'
import { config } from 'dotenv'
import { commands } from '../src'
import chalk from 'chalk'
import boxen from 'boxen'
import figlet from 'figlet'

config()

// Create a beautiful header
const appName = figlet.textSync('CHAMELEON', {
  font: 'Standard',
  horizontalLayout: 'full'
})

// Set the title color to green
const title = chalk.green(appName) 

// Create a box for the welcome message
const welcomeBox = boxen(
  `${title}\n\n${chalk.bold('The modern CLI for generating beautiful changelogs!')}\n
${chalk.dim('Powered by')} ${chalk.greenBright('Greptile')}\n
${chalk.blue('Visit GitHub Repository:')} ${chalk.underline('https://github.com/greptileai/chameleon')}`,
  {
    margin: 1,
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#222',
  }
)

// Display the welcome box
console.log(welcomeBox)

const run = yargs(process.argv.slice(2))
run.usage(
  chalk.blueBright(
    `Welcome to the modern changelog generator CLI!\n
    See more on https://github.com/greptileai/chameleon`,
  ),
)
for (const command of commands) {
  run.command(command as CommandModule)
}

if (process.argv.length <= 2) {
  run.showHelp()
} else {
  run.demandCommand(1, chalk.yellow('You need at least one command before moving on')).help().argv
}
