export default {
  lineItems: order => order.lineItems.reduce((actions, lineItem) => {
    if (lineItem.state)
      actions.push(
        ...lineItem.state.reduce((stateActions, state) => {
          if (state.fromState && state.toState) {
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
          return stateActions
        }, []),
      )

    return actions
  }, []),

  customLineItems: order =>
    order.customLineItems.reduce((actions, lineItem) => {
      if (lineItem.state)
        actions.push(
          ...lineItem.state.reduce((stateActions, state) => {
            if (state.fromState && state.toState) {
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
            return stateActions
          }, []),
        )

      return actions
    }, []),
}
