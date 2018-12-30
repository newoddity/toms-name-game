"use strict"
let $ = require('jquery');
let Handlebars = require('handlebars/dist/handlebars');

module.exports = class NameGame {
	constructor(args, opts){
		this.args = args;
		this.opts = opts;
		this.data = {};
		this.dataIds = [];

		this.gameData = {
			type          : '',
			questionIndex : 0,
			questionCount : 0,
			questions     : [],
		};
		this.gameTypes = [
			'nameThatFace',
			'faceThatName',
			'mattOrNott',
			'theTest',
		];
	}

	init() {

		this.stages = {
			'$loading'   : $('.stage-loading'),
			'$home'      : $('.stage-home'),
			'$question'  : $('.stage-question'),
			'$segway'    : $('.stage-segway'),
			'$history'   : $('.stage-history'),
		};

		this.templates = {
			'gameQuestion'    : Handlebars.compile( document.getElementById('game-question').innerHTML ),
			'historyQuestion' : Handlebars.compile( document.getElementById('history-question').innerHTML ),
		}

		this.$statusContent = $('.status-panel .content');

		const $gameNav = this.stages.$home.find('.nav-game');
		let key;

		this.stages.$loading.find('.status').html('Loading Data');

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

		/* Setup Menu Events*/
		/* Combine the game types with the other navigation items we have. */
		this.stages.$home.find('.nav-game a.btn').on('click', (event) => {
			event.stopPropagation();
			event.preventDefault();
			$('body').addClass('not-at-home');
			this.startGame( event.currentTarget.hash.substr(1) );
		});
		$('.go-home').on('click', (event) => {
			// TODO: Add confirmation if the user wants to abandon game.
			this.gameData = {
				type: '',
				questionIndex: 0,
				questions: [],
			};
			this.$statusContent.html('Home');
			$('body').removeClass('not-at-home');
			this.transition('$home');
		});
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
		const hash = window.location.hash.substr(1);

		this.stages.$loading.find('.status').html('Game is ready!');

		if( hash && this.gameTypes.hasOwnProperty( hash ) ) {
			this.startGame( hash );
		} else {
			this.transition('$home');
		}
	}


	startGame( type ) {
		if( type === 'history' ) {
			// Show history and do not create/start a game.
			this.showResults();
			return;
		}

		if( type === 'thermonuclearWarfare' ) {
			this.stages.$segway.find('.content').html('<p>This did not go so well last time. Here is a kitten instead.</p><img src="https://placekitten.com/200/300" alt="A cute kitten." title="Make kittens not war." \\>');
			$('body').addClass('not-at-home');
			this.transition('$segway');
			return;
		}

		// Setup the game and start it.
		this.gameData = this.buildGameData( type, 4, 4 );
		this.askQuestion();
	}

	askQuestion() {

		if(this.gameData.questionIndex >= this.gameData.questions.length) {
			this.endGame();
			return;
		}
		const currentQuestion = this.populateQuestion( this.gameData.questions[this.gameData.questionIndex] );

		this.stages.$question.html(this.templates.gameQuestion(currentQuestion));

		// register events
		$('input[type="radio"]', this.stages.$question).on('change', (event) => {this.answer(event.currentTarget.id);});

		// Game statistics -- Store time in timestamp. We will be referencing the difference in seconds more often than figuring out human readable dates.
		this.gameData.questions[this.gameData.questionIndex].start = new Date().getTime();
		this.gameData.questions[this.gameData.questionIndex].stop = 0;

		this.transition('$question');

		this.$statusContent.html(`Question ${this.gameData.questionIndex+1} of ${this.gameData.questionCount}`);
	
	}
	answer( id ) {
		this.gameData.questions[this.gameData.questionIndex].stop = new Date().getTime();
		this.gameData.questions[this.gameData.questionIndex].response = id;
		
		if( this.gameData.type === "theTest" ) {
			this.stages.$segway.find('.content').html('<p>You\'re doing great! Onto the next page.</p>');
		} else if(this.gameData.type === "mattOrNott") {
			// We live in the modern age. If someone has the three consecutive letters M A and T in their name, they can be a Mat!

			if(this.gameData.questions[this.gameData.questionIndex].isMatt) {
				this.stages.$segway.find('.content').html(`<p>It was a Mat! ${id} points for Gryffindor.</p>`);
				this.gameData.questions[this.gameData.questionIndex].score = id;
			} else {
				this.stages.$segway.find('.content').html(`<p>It was not a Mat. ${(id * -1)} points for Gryffindor.</p>`);
				this.gameData.questions[this.gameData.questionIndex].score = id * -1;
			}
		} else {
			if( id === this.gameData.questions[this.gameData.questionIndex].correct ) {
				this.stages.$segway.find('.content').html('<p>Good job! That is correct. On to the next page.</p>');
			} else {
				this.stages.$segway.find('.content').html('<p>Not the correct answer, but there is no losing. There is only winning and learning. On to the next page.</p>');
			}
		}
		this.transition('$segway');
		this.gameData.questionIndex++;
		setTimeout(() => {this.askQuestion()}, 3000);
	}

	transition(newStage) {
		let key;
		for( key in this.stages ) {
			this.stages[key].removeClass('active');
		}
		this.stages[newStage].addClass('active');
	}

	buildGameData(type, questionCount = 10, optionCount = 4) {
		let gameData = {
			'type'			: type,
			'questionIndex' : 0,
			'questionCount' : 0,
			'questions'		: [],
		};
		let usedIds = [];

		/* Prevents infinite loop trying to find answers and options when there is not enough data. */
		questionCount = questionCount > this.dataIds.length ? this.dataIds.length : questionCount;
		optionCount = optionCount > (this.dataIds.length-1) ? (this.dataIds.length-1) : optionCount;

		if( questionCount <= 2 ) {
			throw new Error('There are not enough entries in the data to create a game.');
		}

		gameData.questionCount = questionCount;

		/* Making pasta with the magic sauce. */
		/* Keep going until you have made a number of questions that equals questionCount. */
		/* Find an ID to be our answer that is not currently in the questions/ */
		/* Find three other IDs that are not the answer or existing answer. */
		while( Object.keys(gameData.questions).length < questionCount ) {
			let answerId = this.dataIds[Math.floor(Math.random()*this.dataIds.length)];
			let options = [];
			let thisType = type;

			while(thisType === 'theTest') { 
				let number = Math.floor(Math.random()*this.gameTypes.length);
				thisType = this.gameTypes[number];
			}

			if( !usedIds.includes(answerId) ) {
				usedIds.push(answerId);
				if (thisType === 'nameThatFace' || thisType === 'faceThatName'){
					console.log('getting options');
					while( options.length < optionCount ) {
						let optionId = this.dataIds[Math.floor(Math.random()*this.dataIds.length)];
						if( optionId !== answerId && !Object.keys(options).includes(optionId) ) {
							options.push(optionId);
						} /* Unique option condition */
					} /* Option loop */
					// insert the correct answer into a random position.
					options.splice(Math.floor(Math.random()*optionCount-1), 0, answerId );
				} /* Question type condition (Do not need options for Matt Or Nott)*/
				gameData.questions.push({
					'type':     thisType,
					'correct':  answerId,
					'options':  options,
					'response': false,
				});
			} /* Unique answer condition */
		} /* Answer loop */
		return gameData;
	}

	populateQuestion(questionData){
		// Careful, when referencing properties (array indexes) of a passed argument, you are messing with it byref. We do not want
		// bloated info in the gameData, so we will make a temporary object to be returned.
		// TLDR: I was flumixed for a moment trying to figure out why the saved game data had everything in it.
		let question = questionData.constructor();

		question.correct  = questionData.correct;
		question.response = questionData.response;
		question.start    = questionData.start;
		question.stop     = questionData.stop;
		question.type     = questionData.type;
		question.imgSrc   =  this.data.get(question.correct).headshot.url;
		question.name     =  this.data.get(question.correct).firstName + ' ' + this.data.get(question.correct).lastName;
		question.options  = [];

		// If we are populating an answered question from the history, let's do some math.
		if( question['response'] ) {
			question['isCorrect'] = question['response'] === question['correct'];
			question['timeToAnswer'] = ( question['stop'] - question['start'] ) / 1000;
		}

		if( question.type === 'nameThatFace' || question.type === 'mattOrNott' ) {
			question['showImg'] = true;
		}

		switch(question.type) {
			case 'mattOrNott':
				let fname = this.data.get(question.correct).firstName;
				let lname = this.data.get(question.correct).lastName;

				question['text'] = 'How Matt does this person look?';
				question['isMatt'] = !!(fname.match(/matt/i) || lname.match(/matt/i));

				for(let i = -4; i <= 4; i++) {
					question['options'].push({
						'id'      : i,
						'name'    : i,
						'shortcut': i+5,
					});
				}
				break;
			case 'nameThatFace':
			case 'faceThatName':
				question['text'] = 'Who does this person look like?';
				for(let i = 0; i < questionData.options.length; i++) {
					if( !this.data.has(questionData.options[i]) ) {
						continue;
					}
					let classes = '';
					classes += questionData.options[i] === question.response ? ' chosen' : '';
					classes += questionData.options[i] === question.correct ? ' correct' : '';
					question.options[i] = {
						'id'       : questionData.options[i],
						'name'     : this.data.get(questionData.options[i]).firstName + ' ' + this.data.get(questionData.options[i]).lastName,
						'imgSrc'  : this.data.get(questionData.options[i]).headshot.url,
						'shortcut' : i,
						'classes' : classes,
					};

					if( question.type === 'faceThatName' ) {
						question.options[i]['showImg'] = true;
					} else {
					}

				}
				break;
			default:
		}
		return question;
	}

	endGame() {
		const gameid = 'game-' + new Date().getTime();
		localStorage.setItem(gameid, JSON.stringify(this.gameData));
		this.$statusContent.html('');
		this.showResults(gameid);
	}

	showResults( gameId = false ) {
		const $answerHistory = this.stages.$history.find('.gameResults');
		const $log = this.stages.$history.find('.log');
		let gameLogs = [];
		let gameStats;
		let output;
		let key;

		$answerHistory.find('.questions').html('');
		$answerHistory.find('.score').html('');
		$log.html('');

		for( let i = 0; i <= localStorage.length; i++ ) {
			if( localStorage.key(i) && localStorage.key(i).startsWith('game-') ) {
				console.log(localStorage.key(i));
				gameLogs.push(localStorage.key(i));
			}
		}

		if( gameId ) {
			gameStats = localStorage.getItem(gameId);
		} else {
			if( gameLogs.length ) {
				gameStats = localStorage.getItem(gameLogs[0]);
			}
		}

		gameStats = JSON.parse(gameStats);

		if( gameStats ) {
			gameStats.score = 0;
			gameStats.possibleScore = 0;

			for( key in gameStats.questions ) {
				let populatedQuestion = this.populateQuestion( gameStats.questions[key] );
				console.log(populatedQuestion);
				if( populatedQuestion.type === 'mattOrNott' ) {
					let text = 'This is not a Mat.';
					if( populatedQuestion.isMatt ) {
						text = 'This could be a Mat!'
						gameStats.score += parseInt(populatedQuestion.response);
					} else {
						gameStats.score -= parseInt(populatedQuestion.response);
					}
					gameStats.possibleScore += 4;
					populatedQuestion.options = [{'name':`${text} Out of -4 to 4 you chose ${populatedQuestion.response}`}]
				} else {
					gameStats.possibleScore++;
					if(populatedQuestion.response === populatedQuestion.answer) {
						gameStats.score++;
					}
				}

				$(this.templates.historyQuestion( populatedQuestion )).appendTo($answerHistory.find('.questions'));
			}
			this.stages.$history.find('.score').html(`You scored ${gameStats.score} out of ${gameStats.possibleScore}`);
		} else {
			$answerHistory.html('<p><em>There are no game logs.</em></p>');
		}


		for( key in gameLogs ) {
			let gameTime = new Date(gameLogs[key].substr(5)*1);
			let logEntry = '<li><a href="#history?id=' + gameLogs[key] + '">';

			logEntry += [gameTime.getMonth()+1, gameTime.getDay()+1, gameTime.getFullYear()].join('/') + ' ';
			logEntry += ( gameTime.getHours() < 10 ? '0' : '' ) + gameTime.getHours() + ':' + ( gameTime.getMinutes() < 10 ? '0' : '' ) + gameTime.getMinutes();
			logEntry += '</a></li>';

			$(logEntry)
				.on('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					this.showResults(gameLogs[key]);
				})
				.appendTo($log);
		}

		this.$statusContent.html('Viewing history');
	
		this.transition('$history');
	}
}

function error(str) {
	console.log('Error: ' + str);
}
