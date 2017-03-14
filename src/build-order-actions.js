import keyBy from 'lodash.keyby'

const findReturnInfo = (returnInfo, list) =>
  list.find(item => (
    item.returnTrackingId === returnInfo.returnTrackingId
    &&
    item.returnDate === returnInfo.returnDate
  ))

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

  returnItemState: (item, existingItem) => {
    const actions = []
    if (!existingItem)
      return actions

    if (item.shipmentState !== existingItem.shipmentState)
      actions.push({
        action: 'setReturnShipmentState',
        returnItemId: item.id,
        shipmentState: item.shipmentState,
      })

    if (item.paymentState !== existingItem.paymentState)
      actions.push({
        action: 'setReturnPaymentState',
        returnItemId: item.id,
        paymentState: item.paymentState,
      })
    return actions
  },

  returnInfo: (order, existingOrder) => {
    const actions = []

    order.returnInfo.forEach((returnInfo) => {
      const existingReturnInfo = findReturnInfo(
        returnInfo, existingOrder.returnInfo)

      // if returnInfo was not found in existing items
      if (!existingReturnInfo)
        actions.push({
          action: 'addReturnInfo',
          ...returnInfo,
        })

      // if returnInfo exists check returnItems payment and shipment states
      else if (existingReturnInfo) {
        const existingItems = keyBy(existingReturnInfo.items, 'id')

        returnInfo.items.forEach((returnItem) => {
          actions.push(...buildOrderMethods.returnItemState(
            returnItem, existingItems[returnItem.id],
          ))
        })
      }
    })
    return actions
  },
}

export default buildOrderMethods
