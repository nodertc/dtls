module.exports = {
  createWindow
}

const defaultAccessor = sequenceNumber => sequenceNumber

class SlidingWindow {
  constructor(size) {
    this._size = size
    this.reset()
  }

  match(sn, accessor) {
    if (typeof accessor !== 'function') {
      accessor = defaultAccessor
    }

    const sequenceNumber = accessor(sn)

    if (typeof sequenceNumber !== 'number') {
      throw new TypeError('The value of sequenceNumber should be a number.')
    }

    return sequenceNumber >= this._left && sequenceNumber <= this._right
  }

  reset(value = 0) {
    if (typeof value !== 'number') {
      throw new TypeError('Argument `value` should be a number.')
    }

    this._left = value
    this._right = value + this._size
  }
}

/**
 * Creates a sliding window.
 * @param {number} size
 * @returns {SlidingWindow}
 */
function createWindow(size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument `size` should be a number.')
  }

  if (size < 32) {
    throw new Error('Sliding window should equals at least 32.')
  }

  return new SlidingWindow(size)
}
