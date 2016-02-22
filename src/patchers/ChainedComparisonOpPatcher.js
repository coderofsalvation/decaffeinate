import BinaryOpPatcher from './BinaryOpPatcher';
import NodePatcher from './NodePatcher';
import type { Editor, Node, ParseContext } from './types';

/**
 * Handles constructs of the form `a < b < c < … < z`.
 */
export default class ChainedComparisonOpPatcher extends NodePatcher {
  /**
   * `node` should have type `ChainedComparisonOp`.
   */
  constructor(node: Node, context: ParseContext, editor: Editor, expression: BinaryOpPatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  patchAsExpression() {
    this.expression.patch();
    this.getMiddleOperands().forEach(middle => {
      let middleAgain = middle.makeRepeatable(true, 'middle');
      // `a < b < c` → `a < b && b < c`
      //                     ^^^^^
      this.insert(middle.after, ` && ${middleAgain}`);
    });
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * @private
   */
  getMiddleOperands(): Array<NodePatcher> {
    let result = [];
    let comparison = this.expression.left;
    while (comparison instanceof BinaryOpPatcher) {
      result.unshift(comparison.right);
      comparison = comparison.left;
    }
    return result;
  }
}