'use strict';

var path = require('path');
var grunt = require('grunt');

var EventEmitter = require('events').EventEmitter;

var BowerAssets = require('../tasks/lib/bower_assets');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */


function verify(name, message, expected, test, bower) {
  function setupBowerConfig(name) {
    return new BowerAssets(bower, path.join(__dirname, 'fixtures', name));
  }

  var bowerAssets = setupBowerConfig(name);
  bowerAssets.get()
    .on('end', function(actual) {
      test.deepEqual(actual, expected, message);
      test.done();
    })
    .on('error', function(err) {
      test.ok(false, err);
      test.done();
    });
}

exports.bower_assets = {
  setUp: function(done) {
    var bowerCommands = {
      infoMap: {},
      list: new EventEmitter()
    };
    this.bowerCommands = bowerCommands;

    this.bower = {
      commands: {
        list: function() {
          return bowerCommands.list;
        },
        info: function(pkg) {
          bowerCommands.infoMap[pkg] = new EventEmitter();
          return bowerCommands.infoMap[pkg];
        }
      },
      config: {
        json: 'component.json',
        directory: 'components'
      }
    };

    done();
  },

  tearDown: function(done) {
    delete this.bowerCommands;
    delete this.bower;
    done();
  },

  currentStateOfBower: function(test) {
    test.expect(1);

    var expected = {
      "__untyped__": {
        "jquery": [path.normalize("components/jquery/jquery.js")]
      }
    };

    verify(
      'current_state_of_bower',
      'should return all main paths in "__untyped__" group',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {"jquery": path.normalize("components/jquery/jquery.js")});
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", version: "2.1.1"});
  },

  extendedComponentJson: function(test) {
    test.expect(1);

    var expected = {
      "__untyped__": {
        "jquery": [ path.normalize("components/jquery/jquery.js") ]
      },
      "js": {
        "bootstrap-sass": [
          path.normalize("components/bootstrap-sass/js/bootstrap-affix.js"),
          path.normalize("components/bootstrap-sass/js/bootstrap-modal.js")
        ]
      },
      "scss": {
        "bootstrap-sass": [ path.normalize("components/bootstrap-sass/lib/_mixins.scss") ]
      }
    };

    verify(
      'extended_component_json',
      'should return extended set of paths in "js" and "scss" groups',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {
      "bootstrap-sass": [
        path.normalize("components/bootstrap-sass/docs/assets/js/bootstrap.js"),
        path.normalize("components/bootstrap-sass/docs/assets/css/bootstrap.css")
      ],
      "jquery": path.normalize("components/jquery/jquery.js")
    });
    this.bowerCommands.infoMap["bootstrap-sass"].emit('end', {"name": "bootstrap-sass", "version": "3.2.0"});
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", "version": "2.1.1"});
  },

  overrideHonoringNativeBowerConfiguration: function(test) {
    test.expect(1);

    var expected = {
      "__untyped__": {
        "jquery": [ path.normalize("bo_co/jquery/jquery.js") ]
      },
      "js": {
        "bootstrap": [
          path.normalize("bo_co/bootstrap/js/bootstrap-affix.js")
        ]
      },
      "scss": {
        "bootstrap": [ path.normalize("bo_co/bootstrap/lib/_mixins.scss") ]
      }
    };

    this.bower.config.directory = 'bo_co';

    verify(
      'honor_bowerrc',
      'should honor native Bower configuration while overriding packages',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {
      "bootstrap": [
        path.normalize("bo_co/bootstrap/docs/assets/js/bootstrap.js"),
        path.normalize("bo_co/bootstrap/docs/assets/css/bootstrap.css")
      ],
      "jquery": path.normalize("bo_co/jquery/jquery.js")
    });
    this.bowerCommands.infoMap["bootstrap"].emit('end', {"name": "bootstrap", "version": "3.2.0"});
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", "version": "2.1.1"});
  },

  overrideRegexBowerConfiguration: function(test) {
    test.expect(1);

    var expected = {
      "js": {
        "bootstrap": [ path.normalize("bo_co/bootstrap/js/bootstrap-affix.js") ],
        "jquery": [
          path.normalize("bo_co/jquery/jquery-migrate.js"),
          path.normalize("bo_co/jquery/jquery-migrate.min.js"),
          path.normalize("bo_co/jquery/jquery.js"),
          path.normalize("bo_co/jquery/jquery.min.js")],
        "underscore": [ path.normalize("bo_co/underscore/underscore.js") ]
      },
      "scss": {
        "bootstrap": [ path.normalize("bo_co/bootstrap/lib/_mixins.scss") ]
      },
      "css": {
        "underscore": [ path.normalize("bo_co/underscore/underscore.css") ]
      }
    };

    this.bower.config.directory = 'bo_co';

    verify(
      'regexOverridesOfBower',
      'should match jquery using regex expression "*"',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {
      "bootstrap": [
        path.normalize("bo_co/bootstrap/docs/assets/js/bootstrap.js"),
        path.normalize("bo_co/bootstrap/docs/assets/css/bootstrap.css")
      ],
      "jquery": path.normalize("bo_co/jquery/jquery.js"),
      "underscore": [
        path.normalize("bo_co/underscore/underscore.js"),
        path.normalize("bo_co/underscore/underscore.css")
      ]
    });
    this.bowerCommands.infoMap["bootstrap"].emit('end', {"name": "bootstrap", "version": "3.2.0"});
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", "version": "2.1.1"});
    this.bowerCommands.infoMap["underscore"].emit('end', {"name": "underscore", "version": "1.0.17"});
  },

  support_bower_components_folder: function(test) {
    test.expect(1);

    var expected = {
      "__untyped__": {
        "jquery": [path.normalize("bower_components/jquery/jquery.js")]
      }
    };

    var bower = require("bower");

    this.bower.config.directory = bower.config.directory;
    this.bower.config.json = 'bower.json';
    verify(
      'support_bower_components_folder',
      'should match "bower_components"',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {
      "jquery": path.normalize("bower_components/jquery/jquery.js")
    });
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", "version": "2.1.1"});
  },

  exportsOverrideWithPackageName: function(test) {
    test.expect(1);

    var expected = {
      "js": {
        "jquery-2.1.1": [path.normalize("components/jquery/jquery.js")]
      }
    };

    verify(
      'exportsOverrideWithPackageName',
      'should use metadata of "jquery" package',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {"jquery": path.normalize("components/jquery/jquery.js")});
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", version: "2.1.1"});
  },

  exportsOverrideWithPackageNameMixed: function(test) {
    test.expect(1);

    var expected = {
      "js": {
        //no packageName
        "jquery": [path.normalize("components/jquery/jquery.js")],
        //uses "{{version_safe}}"
        "lodash-3.2.0_2": [path.normalize("components/lodash/lodash.js")]
      }
    };

    verify(
      'exportsOverrideWithPackageNameMixed',
      'should use metadata of "bootstrap" package and leave "jquery" as is',
      expected,
      test,
      this.bower);

    this.bowerCommands.list.emit('end', {
      "jquery": path.normalize("components/jquery/jquery.js"),
      "lodash": path.normalize("components/lodash/lodash.js")
    });
    this.bowerCommands.infoMap["jquery"].emit('end', {"name": "jquery", version: "2.1.10"});
    this.bowerCommands.infoMap["lodash"].emit('end', {"name": "lodash", version: "3.2.0+2"});
  }
};
