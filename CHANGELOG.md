<a name="1.4.6"></a>
## 1.4.6 (2021-08-16)

### Features

* CE-1175 avoid user to import files to read only site
* CE-1125 add function to choose files in the import page

### Improvements
* CE-1127 Add ability for the user to change the prefill selected site from the deployment to any other site of their choice
* CE-1126 When the user drops files directly into the site that has been selected on the left navigation bar, auto prefill that site on the select site page
* CE-550 User can retry all files in the site that failed
* CE-923 Error files in the completed tab will always show at the top of the list, no more scrolling down to see error files

### Others
* CE-896 Refactor code to get metadata in file header

<a name="1.4.5"></a>
## 1.4.5 (2021-06-16)

### New flow of importing files (#126)
* CE-800 & CE-899 The site list on the left is changed to be ‘Recent Uploads’ where it will only show the site that you are importing/uploading files to (see video#2)
* CE-799 After the user drag&drop folder into the app, the app will redirect to Select Site page for you to choose the site / will auto detect the site from the deployment if any (see video#1)
* CE-822 Show error messages to the user when there is something wrong with the AudioMoth deployment (e.g. attached site got removed, user doesn’t have access to site that attached with deployment)
* CE-885 Do not auto retry to upload to site that user doesn’t have permission to  (#127)
* CE-901 Show empty state message in site selector when there is no site in the project user has chosen  (#128)

### Bug Fixes
* CE-849 Project removed from Arbimon, isn’t removed from the project selector field in Uploader  (#126)
* CE-531 Auto retry checksum mismatch files for 3 times before throwing error to the user  (#126)

<a name="1.4.4"></a>
## 1.4.4 (2021-06-06)

### Improvements
* CE-612  Improve uploading progress bar UI (show summary number and make pause button bigger)
* CE-665 Improve summary view (show verified -> completed -> failed)
* CE-482 Improve ffprobe error message, and add retry button for the user to retry upload ffprobe failed files
* CE-765  Improve ‘up-to-date’ alert UI

### Bug fixes
* CE-663 Auto update bug fixes (also, related to CE-805 CE-424)


<a name="1.4.3"></a>
## 1.4.3 (2021-05-27)

### Features
* CE-508 CE-627 Site and project selector when importing files
* CE-664 Change file state from ‘processing’ to be ‘verified’
