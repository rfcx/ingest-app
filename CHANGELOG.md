<a name="1.5.4"></a>
## 1.5.4 (2023-02-24)

### Bug Fixes

* Return users back to the universal login page if the load/parse tokens issue occurs
* Order matched site to the top of the list
* Fix wrong spelling on the site selector section

<a name="1.5.3"></a>
## 1.5.3 (2022-12-14)

### Bug Fixes

* rfcx/engineering-support#219 Detect site and project when 0 bytes file in the list
* Fixed a drag & drop folder issue

<a name="1.5.2"></a>
## 1.5.2 (2022-11-21)

### Bug Fixes

* rfcx/engineering-support#197 Fix flac and opus files fail to upload correctly

<a name="1.5.1"></a>
## 1.5.1 (2022-10-18)

### Improvements

* rfcx/engineering-support#167 SD cards from Song Meter Micro (SMM) recorders are not showing up
* rfcx/engineering-support#172 Cannot auto-detect the first file in the SD card/folder/files from Song Meter

<a name="1.5.0"></a>
## 1.5.0 (2022-10-11)

### Features

* #169 #170 #171 #172 #173 Song Meter support (auto-detect when using Companion)

### Improvements

* #166 Fix double-click on import incorrectly selects multiple options

<a name="1.4.10"></a>
## 1.4.10 (2022-04-28)

### Improvements

* #137 Reload backgroud process for uploading when it crashed
* #142 Improve error message about 0 byte files
* #143 Prevent user to queue 0 byte files to upload

<a name="1.4.9"></a>
## 1.4.9 (2022-02-17)

### Improvements

* HOTFIX Memory leak issue by changing the library for creating checksum

<a name="1.4.8"></a>
## 1.4.8 (2021-10-01)

### Improvements

* CE-954 add ability for user to update site information / and auto update site information when user import file to site

<a name="1.4.7"></a>
## 1.4.7 (2021-09-15)

### Features

* CE-1381 add timezone confirm dialog before upload

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
