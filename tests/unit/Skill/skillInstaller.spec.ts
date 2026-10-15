import should from 'should';
import * as fs from 'fs-extra';
import * as path from 'path';
import { useTmpFiles } from '../../lib/tmpFiles';
import { installSkill, KNOWN_AGENTS, resolveTargets, SKILL_NAME } from '../../../src/Skill/Install/skillInstaller';

describe('Skill.skillInstaller', function () {
	const tmpDir = useTmpFiles();
	let home: string;

	beforeEach(async function () {
		home = path.join(tmpDir, 'home');
		await fs.emptyDir(home);
	});

	describe('resolveTargets', function () {
		it('should pick every known agent whose home directory exists', async function () {
			await fs.ensureDir(path.join(home, '.claude'));
			await fs.ensureDir(path.join(home, '.cursor'));

			const targets = await resolveTargets(home, undefined, undefined);

			should(targets.map((t) => t.agent)).deepEqual(['claude', 'cursor']);
			should(targets[0]!.dir).equal(path.join(home, '.claude', 'skills', SKILL_NAME));
			should(targets[1]!.dir).equal(path.join(home, '.cursor', 'skills', SKILL_NAME));
		});

		it('should return nothing when no agent directory exists', async function () {
			should(await resolveTargets(home, undefined, undefined)).deepEqual([]);
		});

		it('should install for explicitly named agents even when their directory is missing', async function () {
			const targets = await resolveTargets(home, ['copilot'], undefined);
			should(targets).deepEqual([{ agent: 'copilot', dir: path.join(home, KNOWN_AGENTS.copilot.skills, SKILL_NAME) }]);
		});

		it('should reject an unknown agent name', async function () {
			await should(resolveTargets(home, ['gemini'], undefined)).be.rejectedWith(/Unknown agent "gemini"/);
		});

		it('should reject object prototype names as agents', async function () {
			await should(resolveTargets(home, ['constructor'], undefined)).be.rejectedWith(/Unknown agent "constructor"/);
		});

		it('should install only into --dir and skip detected agents', async function () {
			await fs.ensureDir(path.join(home, '.codex'));
			const targets = await resolveTargets(home, undefined, path.join(home, 'custom'));
			should(targets).deepEqual([{ agent: 'dir', dir: path.resolve(home, 'custom', SKILL_NAME) }]);
		});

		it('should combine --dir with explicitly named agents', async function () {
			const targets = await resolveTargets(home, ['claude'], path.join(home, 'custom'));
			should(targets.map((t) => t.agent)).deepEqual(['dir', 'claude']);
		});
	});

	describe('installSkill', function () {
		it('should copy the skill files, record the CLI version, and overwrite on reinstall', async function () {
			const source = path.join(tmpDir, 'source');
			await fs.outputFile(path.join(source, 'SKILL.md'), '# v1');
			const target = { agent: 'claude' as const, dir: path.join(home, '.claude', 'skills', SKILL_NAME) };

			await installSkill(source, target, '4.4.0');
			should(await fs.readFile(path.join(target.dir, 'SKILL.md'), 'utf8')).equal('# v1');
			const installed = await fs.readJson(path.join(target.dir, 'INSTALLED.json'));
			should(installed.cliVersion).equal('4.4.0');
			should(new Date(installed.installedAt).getTime()).be.above(0);

			await fs.outputFile(path.join(source, 'SKILL.md'), '# v2');
			await installSkill(source, target, '4.5.0');
			should(await fs.readFile(path.join(target.dir, 'SKILL.md'), 'utf8')).equal('# v2');
			should((await fs.readJson(path.join(target.dir, 'INSTALLED.json'))).cliVersion).equal('4.5.0');
		});
	});
});
