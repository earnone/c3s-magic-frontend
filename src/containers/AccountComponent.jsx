
import React, { Component } from 'react';
import { Col, Row, Card } from 'reactstrap';
import PropTypes from 'prop-types';
import { getConfig } from '../getConfig';
let config = getConfig();

export default class AccountComponent extends Component {
  constructor () {
    console.log('constructing AccountComponent');
    super();
    this.state = {
    };
  }

  render () {
    const { accessToken, emailAddress, clientId, domain } = this.props;
    const { backendHost } = config;
    return (
      <div className='MainViewport'>
        <Row>
          <Col xs='auto'>
            <div className='text'>
              <h1>Your account</h1>
            </div>
          </Col>
        </Row>
        <Row>
          <Col >
            <Card>
              {
                clientId !== null ? <p>Email: {emailAddress}</p> : <p>Not logged in</p>
              }
              {
                clientId !== null ? <p>Id: {clientId}</p> : <p>Your clientID: Not logged in</p>
              }
              {
                <p>Accesstoken: {accessToken}</p>
              }
              {
                clientId !== null ? <p>Compute node: https://{domain}</p> : <p>Your Domain: Not logged in</p>
              }
              {
                <p>DSP Controller: {backendHost}</p>
              }
            </Card>
          </Col>
        </Row>
      </div>);
  }
}

AccountComponent.propTypes = {
  accessToken: PropTypes.string,
  emailAddress: PropTypes.string,
  clientId: PropTypes.string,
  domain: PropTypes.string
};
