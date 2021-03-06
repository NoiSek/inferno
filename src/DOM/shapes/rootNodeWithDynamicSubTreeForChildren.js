import isArray from '../../util/isArray';
import isVoid from '../../util/isVoid';
import { recycle } from '../recycling';
import { addDOMDynamicAttributes, updateDOMDynamicAttributes, clearListeners } from '../addAttributes';
import recreateRootNode from '../recreateRootNode';
import addShapeChildren from '../../shared/addShapeChildren';

export default function createRootNodeWithDynamicSubTreeForChildren(templateNode, subTreeForChildren, dynamicAttrs, recyclingEnabled) {
	const node = {
		pool: [],
		keyedPool: [],
		overrideItem: null,
		create(item, treeLifecycle, context) {
			let domNode;

			if ( recyclingEnabled ) {
				domNode = recycle( node, item, treeLifecycle, context );
				if ( domNode ) {
					return domNode;
				}
			}
			domNode = templateNode.cloneNode( false );

			addShapeChildren(domNode, subTreeForChildren, item, treeLifecycle, context );

			if ( dynamicAttrs ) {
				addDOMDynamicAttributes( item, domNode, dynamicAttrs, node );
			}
			item.rootNode = domNode;
			return domNode;
		},
		update(lastItem, nextItem, treeLifecycle, context) {
			nextItem.id = lastItem.id;

			if ( node !== lastItem.tree.dom ) {
				const newDomNode = recreateRootNode( lastItem, nextItem, node, treeLifecycle, context );

				nextItem.rootNode = newDomNode;
				return newDomNode;
			}
			const domNode = lastItem.rootNode;

			nextItem.rootNode = domNode;
			if ( !isVoid( subTreeForChildren ) ) {
				if ( isArray( subTreeForChildren ) ) {
					for ( let i = 0; i < subTreeForChildren.length; i++ ) {
						const subTree = subTreeForChildren[i];

						subTree.update( lastItem, nextItem, treeLifecycle, context );
					}
				} else if ( typeof subTreeForChildren === 'object' ) {
					subTreeForChildren.update( lastItem, nextItem, treeLifecycle, context );
				}
			}
			if ( dynamicAttrs ) {
				updateDOMDynamicAttributes( lastItem, nextItem, domNode, dynamicAttrs );
			}
		},
		remove(item, treeLifecycle) {
			if (!isVoid( subTreeForChildren)) {
				if (isArray( subTreeForChildren)) {
					for (let i = 0; i < subTreeForChildren.length; i++) {
						const subTree = subTreeForChildren[i];

						subTree.remove(item, treeLifecycle);
					}
				} else if (typeof subTreeForChildren === 'object') {
					subTreeForChildren.remove(item, treeLifecycle);
				}
			}
			if (dynamicAttrs) {
				clearListeners(item, item.rootNode, dynamicAttrs);
			}
		}
	};

	return node;
}
