const buildOrderMethods = {
  customLineItems: (order, existingOrder) =>
    order.customLineItems.reduce((actions, lineItem) => {
      if (lineItem.state)
        actions.push(
          ...lineItem.state.reduce((stateActions, state) => {
            if (state.fromState && state.toState) {
              const quantityTally = buildOrderMethods.checkIffromStateQtytally(
                existingOrder,
                state.fromState.id,
                state._fromStateQty,
                'customLineItems',
              )
              if (quantityTally) {
                const action = {
                  action: 'transitionCustomLineItemState',
                  customLineItemId: lineItem.id,
                  quantity: state.quantity,
                  fromState: state.fromState,
                  toState: state.toState,
                }

                  // Check for optional fields
                if (state.actualTransitionDate)
                  action.actualTransitionDate = state.actualTransitionDate

                stateActions.push(action)
              }
            }
            return stateActions
          }, []),
        )

      return actions
    }, []),
  checkIffromStateQtytally: (existingOrder, stateid, quantity, lineItems) =>
    existingOrder[lineItems].some(lineItem =>
      lineItem.state.some((state) => {
        const stateRef = state.state
        return (stateRef.id === stateid) && (quantity === state.quantity)
      }),
    ),
  lineItems: (order, existingOrder) =>
    order.lineItems.reduce((actions, lineItem) => {
      if (lineItem.state)
        actions.push(
          ...lineItem.state.reduce((stateActions, state) => {
            if (state.fromState && state.toState) {
              const quantityTally = buildOrderMethods.checkIffromStateQtytally(
                existingOrder,
                state.fromState.id,
                state._fromStateQty,
                'lineItems',
              )
              if (quantityTally) {
                const action = {
                  action: 'transitionLineItemState',
                  lineItemId: lineItem.id,
                  quantity: state.quantity,
                  fromState: state.fromState,
                  toState: state.toState,
                }

                  // Check for optional fields
                if (state.actualTransitionDate)
                  action.actualTransitionDate = state.actualTransitionDate

                stateActions.push(action)
              }
            }
            return stateActions
          }, []),
        )
      return actions
    }, []),

  syncInfo: order => order.syncInfo.reduce((actions, syncInfo) => {
    const action = Object.assign({
      action: 'updateSyncInfo',
    }, syncInfo)

    actions.push(action)

    return actions
  }, []),
}

export default buildOrderMethods
