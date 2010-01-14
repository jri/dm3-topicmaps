
DeepaMehta 3 Topicmaps Plugin
=============================

Adds persistent topicmaps to DeepaMehta 3. A topicmap is an arrangement of topics and associations (as displayed on the canvas, left hand side). A user can create any number of topicmaps and switch between them instantly. Topicmaps can be shared with other users.


Requirements
------------

* A DeepaMehta 3 installation  
  <http://github.com/jri/deepamehta3>

* One other DeepaMehta 3 plugin: *DM3 Workspaces*  
  <http://github.com/jri/dm3-workspaces>  
  Note: future versions of the DM3 Topicmaps plugin will not rely on the DM3 Workspaces plugin anymore.


Installation
------------

1.  Go to your DeepaMehta 3 installation directory:
        cd deepamehta3

2.  Download the DM3 Topicmaps plugin:
        couchapp vendor install git://github.com/jri/dm3-topicmaps.git

3.  Activate the plugin by adding one line to DeepaMehta's `_attachments/javascript/plugins.js`:
        add_plugin("vendor/dm3-topicmaps/script/dm3_topicmaps.js")

4.  Copy additional stuff:
        cp -r vendor/dm3-topicmaps/views/dm3-topicmaps views

5.  Install the DM3 Workspaces plugin as described on its homepage:  
    <http://github.com/jri/dm3-workspaces>

6.  Upload changes to CouchDB:
        couchapp push http://localhost:5984/deepamehta3-db

7.  Check if install was successful: visit DeepaMehta 3 in your webbrowser (resp. press reload):  
    <http://localhost:5984/deepamehta3-db/_design/deepamehta3/index.html>  
    If you see the *Topicmap* menu in the upper left corner everything is OK.


Usage Hints
-----------

* Create a new topicmap by choosing *New Topicmap...* from the Topicmap menu.

* Rename a topicmap by revealing it -- topicmaps are topics themself and can be revealed and edited like any other topic.

* Delete a topicmap by revealing it, and then delete it (just like any other topic).

* Search for a topicmap by using the usual *By Time*, *By Type*, oder *By Text* (search by topicmap name) searches.

* Behind the scenes topicmaps are topics themself and every topic (and relation) contained in a topicmap is explicitely related to that topicmap (by means of regular relations). That enables you both: 1) For any selected topic you can see (in the detail panel, right hand side) in which topicmaps it is involved, and 2) By revealing the topicmap (topic) itself you get a listing of all the contained topics (again in the detail panel). This provides you an overview for large topicmaps.


Issues
------

* Renaming of a topicmap is not immediately reflected in the Topicmap menu.

* Deletion of a topicmap is not immediately reflected in the Topicmap menu, that is the deleted topicmap still appears in the menu. IMPORTANT: Once you delete a topicmap you should switch to another topicmap or create a new one.

* For the moment the Topicmap menu lists _all_ topicmaps regardless of ownership or selected workspace. Future versions of the DM3 Topicmaps plugin will list only the topicmaps belonging to the selected workspace (provided the DM3 Workspaces plugin is installed).

* There is no custom icon representing the *Topicmap* type yet.


------------
Jörg Richter  
Jan 14, 2010
