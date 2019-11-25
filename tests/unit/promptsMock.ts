import * as sinon from 'sinon';

interface Question {
	questionName: string;
	answer: any;
}

export const promptsMockFactory = (questionAndAnswers: Question[]) => {
	return sinon.fake(({ name }: {
		name: string;
	}) => {
		const question = questionAndAnswers.find(({ questionName }: Question) => questionName === name);
		if (question) {
			return Promise.resolve({ [name] : question.answer});
		} else {
			return Promise.resolve({});
		}
	});
};
