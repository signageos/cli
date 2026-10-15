import should from 'should';
import sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import { useTmpFiles } from '../../lib/tmpFiles';

const rewireMock = require('rewiremock').default;

const homedirStub = sinon.stub();
rewireMock('os').callThrough().with({ homedir: homedirStub });
rewireMock.enable();
import { skillInstall, SKILL_SOURCE_DIR } from '../../../src/Skill/Install/skillInstallCommand';
import { skill } from '../../../src/Skill/skillCommand';
rewireMock.disable();

type RunOptions = Parameters<typeof skillInstall.run>[0];

describe('Skill.skillInstallCommand', function () {
	const tmpDir = useTmpFiles();
	let home: string;

	beforeEach(async function () {
		home = path.resolve(tmpDir, 'home');
		await fs.emptyDir(home);
		homedirStub.returns(home);
	});

	it('should expose the skill group with the install subcommand', function () {
		should(skill.name).equal('skill');
		should(skill.commands.map((c) => c.name)).deepEqual(['install']);
		should(skillInstall.optionList.map((o) => o.name)).deepEqual(['agent', 'dir']);
	});

	it('should bundle a SKILL.md next to the command', async function () {
		should(await fs.pathExists(path.join(SKILL_SOURCE_DIR, 'SKILL.md'))).be.true();
	});

	it('should bundle confirmed writes and the exact-version applet assignment flow', async function () {
		const content = await fs.readFile(path.join(SKILL_SOURCE_DIR, 'SKILL.md'), 'utf8');
		const writes = content.match(/sos api --method (POST|PUT|DELETE)[^`\n]*/g) ?? [];
		should(writes.length).be.above(0);
		for (const command of writes) {
			should(command).match(/--confirm-write/);
		}
		should(content).match(/"appletVersion": "<version>"/);
		should(content).not.match(/sos device set-content --device-uid <uid> --applet-uid <appletUid> --yes/);
	});

	it('should install into every detected agent directory', async function () {
		await fs.ensureDir(path.join(home, '.claude'));
		await fs.ensureDir(path.join(home, '.copilot'));

		await skillInstall.run({} as RunOptions);

		should(await fs.pathExists(path.join(home, '.claude', 'skills', 'signageos', 'SKILL.md'))).be.true();
		should(await fs.pathExists(path.join(home, '.copilot', 'skills', 'signageos', 'INSTALLED.json'))).be.true();
	});

	it('should fail with guidance when nothing is detected and nothing is named', async function () {
		await should(skillInstall.run({} as RunOptions)).be.rejectedWith(/--agent <name> or --dir <path>/);
	});

	it('should install into --dir', async function () {
		await skillInstall.run({ dir: path.join(home, 'custom') } as RunOptions);
		should(await fs.pathExists(path.join(home, 'custom', 'signageos', 'SKILL.md'))).be.true();
	});
});
