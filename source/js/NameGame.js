"use strict"
let $ = require('jquery');

module.exports = class NameGame {
	constructor(args, opts){
		this.args = args;
		this.opts = opts;
		this.gameTypes = {
			'nameThatFace': {
				'description': 'Choose a name from a set of choices to match a picture.', 
				'title': 'Name That Face',
			}, 
			'faceThatName': {
				'description': 'Choose a picture from a set of choices to match a name.', 
				'title': 'Face That Name',
			}, 
			'mattOrNott': {
				'description': 'On a scale of -5 to 5, judge how Matt someone is based on their picture.', 
				'title': 'Matt or Nott',
			}, 
			'theTest': {
				'description': 'A set number of random question types make up a timed test.', 
				'title': 'The Test©™',
			},
		};
		this.navs = {
			'thermonuclearWarfare': {
				'description': 'Do you even know what you are doing?', 
				'title': 'Thermonuclear Warfare',
			},
			'history': {
				'description': 'See the history of games and tests played on this browser.', 
				'title': 'Game History',
			},
		};
		this.currentTest = {
			questionIndex: 0,
			questions: [],
			stats: {
				questions: [],
			},
		};
		this.gameType = false;
	}

	init() {
		this.stages = {
			'$loading'   : $('.stage-loading'),
			'$home'      : $('.stage-home'),
			'$question' : $('.stage-question'),
			'$segway'   : $('.stage-segway'),
			'$history'   : $('.stage-history'),
		};
		this.templateMenuItem = $('#main-nav-item', this.stages.$home).html().trim();
		this.templateQuestionItemImage = $('#question-image', this.stages.$question).html().trim();
		this.templateQuestionItemText = $('#question-text', this.stages.$question).html().trim();
		this.templateAnswerItemImage = $('#answer-image', this.stages.$question).html().trim();
		this.templateAnswerItemText = $('#answer-text', this.stages.$question).html().trim();
		const $gameNav = $('.nav-game', this.stages.$home);
		let key;
		let navigation = {};

		$('.status', this.stages.$loading).html('Loading Data');

		this.loadData( (data) => {
			if(typeof data !== 'object') {
				error( 'API did not return proper data' );
				// TODO: Show user the error
				return false;
			}
			this.data =	new Map();
			this.dataIds = [];
			for( key in Object.keys(data) ) {
				this.data.set(data[key]['id'], data[key]);
				this.dataIds.push(data[key]['id']);
			}

			/* I know, I am a horrible person. But that narwhal comment is cool. */
			/* And it looks like we are actually doing something important in the background. */
			setTimeout(() => {this.gameReady();}, 1000);
		} );

		/* Setup Menu */
		/* Combine the game types with the other navigation items we have. */
		Object.assign(navigation, this.gameTypes, this.navs);
		for( key in navigation ) {
			let newItem = this.templateMenuItem
				.replace('{slug}', key)
				.replace('{title}', navigation[key]['title'])
				.replace('{description}', navigation[key]['description']);
			$(newItem)
				.on('click', (event) => {
					event.stopPropagation();
					event.preventDefault();
					this.startGame( event.currentTarget.href.hash.replace('#','') );
				})
				.appendTo( $gameNav );
		}
	}

	loadData(callback) {
		$.ajax({
		    url: 'https://willowtreeapps.com/api/v1.0/profiles/',
		    success: callback,
		    fail: ( jqXHR, textStatus ) => {
				error( 'Request failed: ' + textStatus );
			},
		});
	}

	gameReady() {
		const hash = window.location.hash.replace('#','')

		$('.status', this.stages.$loading).html('Game is ready!');

		if( hash && this.gameTypes.hasOwnProperty( hash ) ) {
			this.startGame( hash );
		} else {
			this.transition('$home');
		}
	}


	startGame( type ) {
		this.gameType = type;
		this.currentTest.questions = this.buildTest( type, 4 );
		// Setup Questions
		this.askQuestion();
	}

	askQuestion() {
		if(this.currentTest.questionIndex >= this.currentTest.questions.length) {
			this.endGame();
		}
		const currentQuestion = this.currentTest.questions[this.currentTest.questionIndex];
		let question = '',
		    answers = '';
		
		this.stages.$question
			.removeClass('type-mattOrNott')
			.removeClass('type-nameThatFace')
			.removeClass('type-faceThatName')
			.addClass('type-' + currentQuestion.type);

		switch(currentQuestion.type) {
			case 'mattOrNott':
				question = this.templateQuestionItemImage
					.replace('{{question}}', 'How Matt does this person look?')
					.replace('{{img-src}}', this.data.get(currentQuestion.answer).headshot.url);
					for(let i = -4; i <= 4; i++) {
						answers += this.templateAnswerItemText
							.replace(/{{id}}/g, i)
							.replace(/{{name}}/g, i)
							.replace(/{{shortcut}}/g, i+5);
					}
				break;
			case 'nameThatFace':
				question = this.templateQuestionItemImage
					.replace(/{{question}}/g, 'What is this person\'s name?')
					.replace(/{{img-src}}/g, this.data.get(currentQuestion.answer).headshot.url);
				for(let i = 0; i < 3; i++) {
					answers += this.templateAnswerItemText
						.replace(/{{id}}/g, currentQuestion.options[i])
						.replace(/{{name}}/g, this.data.get(currentQuestion.options[i]).firstName + ' ' + this.data.get(currentQuestion.options[i]).lastName)
						.replace(/{{shortcut}}/g, i+1);
				}
				break;
			case 'faceThatName':
				question = this.templateQuestionItemText
					.replace(/{{question}}/g, 'Who does or did this person look like?')
					.replace(/{{name}}/g, this.data.get(currentQuestion.answer).firstName + ' ' + this.data.get(currentQuestion.answer).lastName);
				for(let i = 0; i < 3; i++) {
					answers += this.templateAnswerItemImage
						.replace(/{{id}}/g, currentQuestion.options[i])
						.replace(/{{img-src}}/g, this.data.get(currentQuestion.options[i]).headshot.url)
						.replace(/{{shortcut}}/g, i+1);
				}
				break;
			default:
		}

		$('.question', this.stages.$question).html(question);
		$('.answers', this.stages.$question).html(answers);
		$('input[type="radio"]', this.stages.$question).on('change', (event) => {this.answer(event.currentTarget.id);})

		// register events
		this.currentTest.stats.questions[this.currentTest.questionIndex] = {
			type: currentQuestion.type,
			correct: currentQuestion.answer,
			start: Date(),
			stop: 0,
			answer: 0,
		};
		this.transition('$question');
		// Wait for clicks

	}
	answer( id ) {
		this.currentTest.stats.questions[this.currentTest.questionIndex].stop = Date();
		this.currentTest.stats.questions[this.currentTest.questionIndex].answer = id;
		if( this.gameType === "theTest" ) {
			$('.content', this.stages.$segay).html('<p>You\'re doing great! On to the next page.</p>');
		} else {
			if( id === this.currentTest.stats.questions[this.currentTest.questionIndex].correct ) {
				$('.content', this.stages.$segay).html('<p>Good job! That is correct. On to the next page.</p>');
			} else {
				$('.content', this.stages.$segay).html('<p>Not the correct answer, but there is no losing. There is only winning and learning. On to the next page.</p>');
			}
		}
		this.transition('$segway');
		this.currentTest.questionIndex++;
		setTimeout(() => {this.askQuestion()}, 3000);

	}
	transition(newStage) {
		let key;
		for( key in this.stages ) {
			this.stages[key].removeClass('active');
		}
		this.stages[newStage].addClass('active');
	}
	buildTest(type, count = 10, options = 4) {
		let test = [];
		const types = Object.keys( this.gameTypes );

		/* Prevents infinite loop trying to find answers and options. */
		count = count > this.dataIds.length ? this.dataIds.length : count;
		options = options > (this.dataIds.length-1) ? (this.dataIds.length-1) : options;

		if( count <= 2 ) {
			throw new Error('There are not enough entries in the data to create a test.');
		}

		/* Making pasta with the magic sauce. */
		/* Keep going until you have made a number of questions that equals count. */
		/* Find an ID to be our answer that is not currently in the test/ */
		/* Find three other IDs that are not the answer or existing answer. */
		while( Object.keys(test).length < count ) {
			let answerId = this.dataIds[Math.floor(Math.random()*this.dataIds.length)];
			let options = [];
			let thisType = type;

			while(thisType === 'theTest') { 
				let number = Math.floor(Math.random()*types.length);
				thisType = types[number];
			}

			if( !Object.keys(test).includes(answerId) ) {
				if (thisType === 'nameThatFace' || thisType === 'faceThatName'){
					while( options.length < 3 ) {
						let optionId = this.dataIds[Math.floor(Math.random()*this.dataIds.length)];
						if( optionId !== answerId && !Object.keys(options).includes(optionId) ) {
							options.push(optionId);
						} /* Unique option condition */
					} /* Option loop */
				} /* Question type condition (Do not need options for Matt Or Nott)*/
				test.push({
					'type'    : thisType,
					'answer'  : answerId,
					'options' : options,
				});
			} /* Unique answer condition */
		} /* Answer loop */
		return test;
	}

	endGame() {
		const gameid = 'game-' + Date();
		localStorage.setItem(gameid, JSON.stringify(this.currentTest.stats));
		this.showResults(gameid);
	}

	showResults( gameId = false ) {
		const $answers = $('.answers', this.stages.$history);
		const $log = $('.log', this.stages.$history);
		let gameLogs = [];
		let gameStats;
		let output;
		let key;

		for( let i = 0; i <= localStorage.length; i++ ) {
			if( localStorage.key(i) && localStorage.key(i).startsWith('game-') ) {
				gameLogs.push(localStorage.key(i));
			}
		}

		console.log(gameLogs);

		if( gameId ) {
			gameStats = localStorage.getItem(gameId);
		} else {
			if( gameLogs.length ) {
				gameStats = localStorage.getItem(gameLogs[0]);
			}
		}

		if( gameStats ) {
			output = '<table><tr><td>Question</td><td>Your Answer</td><td>Correct Answer</td></tr>';
			for( key in gameStats.questions ) {
				let correctID = gameStats.questions[key].correct;
				let answeredID = gameStats.questions[key].answer;
				output += '<tr>';
				if (gameStats.questions[key].type === "mattOrNott") {
					output += '<td>Is this a Matt?</td>';
					output += '<td>On a scale of -4 to 4, you chose: ' + answeredID + '</td>';
					if(this.data.get(correctID).firstName.toLowerCase().startsWith('mat')) {
						output += '<td>This is a Matt! You scored ' + answeredID + ' points.</td>';
					} else {
						output += '<td>This was not a Matt! You scored ' + -answeredID + ' points.</td>';
					}
				} else if (gameStats.questions[key].type === "nameThatFace") {
					output += '<td>Who is this?</td>';
					output += '<td>You said it is  ' + this.data.get(answeredID).firstName + '.</td>';
					if(correctID == answerId) {
						output += '<td>You are right!</td>';
					} else {
						output += '<td>You missed it, but next time you might recognize ' + this.data.get(correctID).firstName + ' ' +this.data.get(correctID).lastName + '</td>';
					}

				} else if (gameStats.questions[key].type === "faceThatName") {
					output += '<td>Who is ' + this.data.get(correctID).firstName + ' ' +this.data.get(correctID).lastName + '</td>';
					output += '<td>You said' + this.data.get(answeredID).headshot.url + '.</td>';
					if(correctID == answerId) {
						output += '<td>You are right!</td>';
					} else {
						output += '<td>It actually was' + this.data.get(correctID).headshot.url + '</td>';
					}
				}
				output += '</tr>';

			}
			output += '</table>';

			$answers.html(output);
		} else {
			$answers.html('<p><em>There are no game logs.</em></p>');
		}
	
		this.transition('$history');
	}
}

function error(str) {
	console.log('Error: ' + str);
}
