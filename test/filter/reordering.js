'use strict';

/* eslint-env jest */

const Emitter = require('events');
const Reordering = require('filter/reordering');
const { contentType } = require('lib/constants');

class MockSlidingWindow {
  constructor(value) {
    this._value = Boolean(value);
  }

  /**
   * @returns {bool}
   */
  check() {
    return this._value;
  }
}

test('epoches should equals', () => {
  const session = {
    isHandshakeInProcess: false,
    peerEpoch: 1,
    lastRvHandshake: 1,
    retransmitter: new Emitter(),
    window: new MockSlidingWindow(true),
  };

  const validRecord = {
    epoch: session.peerEpoch,
    type: contentType.APPLICATION_DATA,
    fragment: {
      sequence: session.lastRvHandshake + 1,
    },
  };

  const invalidRecord = {
    epoch: session.peerEpoch + 1,
    type: contentType.APPLICATION_DATA,
    fragment: {
      sequence: session.lastRvHandshake + 1,
    },
  };

  const reorder = new Reordering(session);

  const callbackValid = jest.fn();
  const callbackInvalid = jest.fn();
  reorder.push = jest.fn();

  reorder._transform(validRecord, null, callbackValid);
  reorder._transform(invalidRecord, null, callbackInvalid);

  expect(reorder.push).toHaveBeenCalledTimes(1);
  expect(reorder.push).toBeCalledWith(validRecord);

  expect(callbackValid).toBeCalledWith();
  expect(callbackValid).toHaveBeenCalledTimes(1);

  expect(callbackInvalid).toBeCalledWith();
  expect(callbackInvalid).toHaveBeenCalledTimes(1);
});

test('drop record replays', () => {
  const session = {
    isHandshakeInProcess: true,
    peerEpoch: 1,
    lastRvHandshake: 2,
    retransmitter: new Emitter(),
    window: new MockSlidingWindow(true),
  };

  const validRecord = {
    epoch: session.peerEpoch,
    type: contentType.HANDSHAKE,
    fragment: {
      sequence: session.lastRvHandshake + 1,
    },
  };

  const invalidRecord = {
    epoch: session.peerEpoch,
    type: contentType.HANDSHAKE,
    fragment: {
      sequence: session.lastRvHandshake + 1,
    },
  };

  const reorder = new Reordering(session);

  const callbackValid = jest.fn();
  const callbackInvalid = jest.fn();
  reorder.push = jest.fn();

  reorder._transform(validRecord, null, callbackValid);

  session.window = new MockSlidingWindow(false);
  reorder._transform(invalidRecord, null, callbackInvalid);

  expect(reorder.push).toHaveBeenCalledTimes(1);
  expect(reorder.push).toBeCalledWith(validRecord);

  expect(callbackValid).toBeCalledWith();
  expect(callbackValid).toHaveBeenCalledTimes(1);

  expect(callbackInvalid).toBeCalledWith();
  expect(callbackInvalid).toHaveBeenCalledTimes(1);
});

test('drop handshake replays', () => {
  const session = {
    isHandshakeInProcess: true,
    peerEpoch: 1,
    lastRvHandshake: 2,
    retransmitter: new Emitter(),
    window: new MockSlidingWindow(true),
  };

  const validRecord = {
    epoch: session.peerEpoch,
    type: contentType.HANDSHAKE,
    fragment: {
      sequence: session.lastRvHandshake + 1,
    },
  };

  const invalidRecord = {
    epoch: session.peerEpoch,
    type: contentType.HANDSHAKE,
    fragment: {
      sequence: session.lastRvHandshake,
    },
  };

  const reorder = new Reordering(session);

  const callbackValid = jest.fn();
  const callbackInvalid = jest.fn();
  reorder.push = jest.fn();

  reorder._transform(validRecord, null, callbackValid);
  reorder._transform(invalidRecord, null, callbackInvalid);

  expect(reorder.push).toHaveBeenCalledTimes(1);
  expect(reorder.push).toBeCalledWith(validRecord);

  expect(callbackValid).toBeCalledWith();
  expect(callbackValid).toHaveBeenCalledTimes(1);

  expect(callbackInvalid).toBeCalledWith();
  expect(callbackInvalid).toHaveBeenCalledTimes(1);
});

test('should sort unordered records', () => {
  const session = {
    isHandshakeInProcess: true,
    peerEpoch: 1,
    lastRvHandshake: 1,
    retransmitter: new Emitter(),
    window: new MockSlidingWindow(true),
  };

  const firstRecord = {
    epoch: session.peerEpoch,
    type: contentType.HANDSHAKE,
    sequenceNumber: 1,
    fragment: {
      sequence: session.lastRvHandshake + 1,
    },
  };

  const secondRecord = {
    epoch: session.peerEpoch,
    type: contentType.HANDSHAKE,
    sequenceNumber: 2,
    fragment: {
      sequence: session.lastRvHandshake + 2,
    },
  };

  const reorder = new Reordering(session);
  reorder.push = jest.fn(() => {
    session.lastRvHandshake += 1;
  });

  const callbackFirst = jest.fn();
  const callbackSecond = jest.fn();

  reorder._transform(secondRecord, null, callbackFirst);
  expect(reorder.push).not.toBeCalled();
  expect(callbackFirst).toBeCalledWith();
  expect(reorder.queueSize).toEqual(1);

  reorder._transform(firstRecord, null, callbackSecond);
  expect(callbackSecond).toBeCalledWith();
  expect(reorder.push).toHaveBeenCalledTimes(2);
  expect(reorder.push).toHaveBeenNthCalledWith(1, firstRecord);
  expect(reorder.push).toHaveBeenNthCalledWith(2, secondRecord);
  expect(reorder.queueSize).toEqual(0);
});
