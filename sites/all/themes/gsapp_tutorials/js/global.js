define({

	_months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	_days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	app: app || {},
	pathArray: window.location.pathname.split('/'),
	updates_detached: null,
	openLessonView: null,

	COURSE_SUMMARY_CHAR_LEN: 400,

	WeeksCollection: []; 
    WeeksCollectionView: {},

	LessonsCollection: [],
    LessonsCollectionView: [],

	UpdatesCollectionView: {},
    UpdatesCollection: [],

	course: null,
    courseNid: null,

	lesson: null,
	lessonNid: null,

	parentLessonView: null,

	EmbedsCollection: [],
	EmbedsCollectionView: [],

	UploadsCollection: [],
	UploadsCollectionView: [],

	tumblr: {},

	FIRST_EDIT_LESSON: 'first-edit-lesson',
	FIRST_EDIT_WEEK: 'first-edit-week',
	FIRST_EDIT_UPDATE: 'first-edit-update',
	FIRST_EDIT_EMBED: 'first-edit-embed',
	FIRST_EDIT_UPLOAD: 'first-edit-upload',
	MODIFIED: 'state-modified',

	lessonEditHallo: {},
	lessonEditHallo.placeholder: {},

	lessonEditHallo.placeholder.field_description: 'Add description here',
	lessonEditHallo.placeholder.title: 'Add title here',
	lessonEditHallo.placeholder.field_video_embed: 'Paste Youtube or Vimeo embed code here'

});



