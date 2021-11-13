import {expect} from 'chai';
import 'mocha-sinon';
import mockFs from 'mock-fs';

let configParser;

describe('Configuration parser', function() {
  beforeEach(function() {
    configParser = require('../../src/config-parser');
    this.sinon.stub(console, 'error');
    this.sinon.stub(process, 'exit');
  });

  afterEach(function() {
    configParser = undefined;
    console.error.restore(); // eslint-disable-line no-console
    process.exit.restore();
    mockFs.restore();
  });

  describe('early exits with a non 0 exit code when', function() {
    it('the specified config file doesn\'t exit', function() {
      const configFilePath = './non/existing/path';
      configParser.getConfiguration(configFilePath);

      const consoleErrorArgs = console.error.args.map(function (args) { // eslint-disable-line no-console
        return args[0];
      });
      expect(consoleErrorArgs[0]).to.include('Could not find specified config file "' + configFilePath + '"');
      expect(process.exit.args[0][0]).to.equal(1);
    });

    it('no config file has been specified and default config file doesn\'t exist', function() {
      mockFs({});
      configParser.getConfiguration();

      const consoleErrorArgs = console.error.args.map(function (args) { // eslint-disable-line no-console
        return args[0];
      });

      expect(consoleErrorArgs[0]).to.include('Could not find default config file');
      expect(process.exit.args[0][0]).to.equal(1);
    });

    it('a bad configuration file is used', function() {
      const configFilePath = 'test/config-parser/bad_config.gplintrc';
      configParser.getConfiguration(configFilePath);

      const consoleErrorArgs = console.error.args.map(function (args) { // eslint-disable-line no-console
        return args[0];
      });

      expect(consoleErrorArgs[0]).to.include('Error(s) in configuration file:');
      expect(process.exit.args[0][0]).to.equal(1);
    });
  });

  describe('doesn\'t exit with exit code 1 when', function() {
    it('a good configuration file is used', function() {
      const configFilePath = 'test/config-parser/good_config.gplintrc';
      const parsedConfig = configParser.getConfiguration(configFilePath);
      expect(process.exit.neverCalledWith(1));
      expect(parsedConfig).to.deep.eq({'no-files-without-scenarios': 'off'});
    });

    it('a good configuration file is used that includes comments', function() {
      const configFilePath = 'test/config-parser/good_config_with_comments.gplintrc';
      const parsedConfig = configParser.getConfiguration(configFilePath);
      expect(process.exit.neverCalledWith(1));
      expect(parsedConfig).to.deep.eq({'no-files-without-scenarios': 'off'});
    });

    it('the default configuration file is found', function() {
      configParser.defaultConfigFileName = 'test/config-parser/stub_default.gplintrc';
      configParser.getConfiguration();
      expect(process.exit.neverCalledWith(1));
    });
  });
});
